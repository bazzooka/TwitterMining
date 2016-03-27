// when get tweets, get nb retweet

var Twitter = require('twitter');
var ElasticSearch = require('./ElasticAPI');
var auth = require('./auth.js');
var config = require('./config.js');
var franc = require('franc');
var getTwitFromProfil = require('./getTwitFromProfil');
var exploreUrl = require('./exploreUrl');
var snowflake = require('./snowflake');

var client = new Twitter({
  consumer_key: auth.consumer_key_profil,
  consumer_secret: auth.consumer_secret_profil,
  access_token_key: auth.access_token_key_profil,
  access_token_secret: auth.access_token_secret_profil
});

var elastic = new ElasticSearch();
var regTopics = new RegExp(config.topics.join('|'), 'gi');
var urlRegExp = new RegExp('https?:(?:/{1,3})([A-z0-9./-])*', 'gi');
var snowflake2Utc = snowflake.snowflake2Utc;
var nbTweetToGetFromProfile = 2;
var dayBeforeProfilReparsing = 2;
var minEnglishScore = 0.7;
var nbDayBeforeScrap = 2;

var textInEnglish = function(text){
  var languages = franc.all(text);

  // get language
  for(var i = 0, ll = languages.length; i < ll; i++){
    if(languages[i][0] === 'eng'){
      if(languages[i][1] > minEnglishScore){
        return true;
      }
      return false;
    }
  }
  return false;
}

// Search in database profil by twitter user id
// Return true profil if profil is in database, else null
var getProfilById = function(profilId){
  return new Promise(function(resolve, reject){
    elastic.findProfil({
      id : profilId
    }).then(function(res){
      if(res.hits.total === 0){
        resolve(null);
      } else {
        resolve(res.hits.hits);
      }
    }).catch(function(err){
      console.log(err);
      reject(err);
    });
  });
}

var analyseTweet = function(tweets ){
  var tweetToInsert = [];
  var nbTweetAdded = 0;   // nbTweet that are relatives to topics

  // Insert in database tweet that are related to topic
  for(var i = 0, l = tweets.length; i < l; i++){
    var matches = tweets[i].text.match(regTopics);
    if( matches && matches.length > 0) {
      // Insert tweet in tweetProfil db
      // elastic.insertTweetProfil()
      var tweet = tweets[i];
      var to_save = {
        crawled: false,
        created_at : tweet.created_at,
        id: tweet.id_str,
        text: tweet.text,
        urls: tweet.text ? tweet.text.match(urlRegExp) : [],
        retweet_count: 0,
        timestamp_ms: tweet.timestamp_ms,
        user: {
          id: tweet.user.id_str,
          name: tweet.user.name,
          screen_name: tweet.user.screen_name
        }
      }

      if(tweet.retweeted_status){
        to_save.retweeted_status = {
          created_at : tweet.retweeted_status.created_at,
          id : tweet.retweeted_status.icreatecred_str,
          retweet_user : {
            id: tweet.retweeted_status.user.id_str,
            name: tweet.retweeted_status.user.name,
            screen_name: tweet.retweeted_status.user.screen_name
          }
        }
      }

      if(textInEnglish(tweet.text)){
        nbTweetAdded++;
        tweetToInsert.push(to_save);
      }
    }
  }

  // Insert all tweet_profil in db
  return new Promise(function(resolve, reject){
    if(nbTweetAdded === 0) {
      resolve(0);
    } else {
      return Promise.all(tweetToInsert.map(elastic.insertTweetProfil.bind(elastic)))
        .then (function(){
          resolve(nbTweetAdded);
        })
        .catch(function(error){
          console.log(err);
          reject(error);
        });
    }
  });
}

var getLastTweetOfProfil = function(tweetParent, profilInDB){
  var tweetUser = tweetParent._source.user;
  // return new Promise(function(resolve, reject){
    var reqParams = {'count': nbTweetToGetFromProfile, 'exclude_replies': true, 'screen_name': tweetUser.screen_name};

    if(profilInDB){
      reqParams.since_id = profilInDB[0]._source.lastTweetId+'';
    }

    try {
      client.get('statuses/user_timeline', reqParams,  function(error, tweets, response){
        if(error) {
          console.log(error);
          return false
          // throw error;
        }
        // 1. Tweet became profiled
        // 2. last nbTweetToGetFromProfile tweets relative to topics are inserted in database
        return Promise.all([
          elastic.updateTweet(tweetParent._id, {profiled: true}),
          analyseTweet(tweets)
        ]).then(function (res){
          if(res[res.length - 1] > 0){
            var totalProceceedTweet = tweets.length;
            var nbTweetAdded = res[res.length - 1];
            if(profilInDB){
              console.log('updateProfilCounter');
              return elastic.updateProfilCounter(
                profilInDB[0]._id,
                {
                  // update counters
                  script: 'ctx._source.lastTweetId = lastTweetId; ctx._source.totalTweet += totalProceceedTweet; ctx._source.totalTweetRelated += nbTweetAdded',
                  params: {
                    totalProceceedTweet: totalProceceedTweet,
                    nbTweetAdded: nbTweetAdded,
                    lastTweetId: tweets[0].id,
                    lastParsingDate: Date.now()
                  }
                }
              )
            } else {
              console.log('insertProfil');
              return elastic.insertProfil({
                id: tweetUser.id,
                screen_name: tweetUser.screen_name,
                totalTweet: totalProceceedTweet,
                totalTweetRelated: nbTweetAdded,
                lastTweetId: tweets[0].id + '',
                lastParsingDate: Date.now()
              });
            }
          } else {
            console.log('nothing to add');
            // resolve (true);
          }

        }).catch(function(err){
          console.log(err);
          // reject(err);
        })

      });
    } catch(err){
      console.log(err[0]);
    };

  // });
}

var miningProfils = function(){
  // Find tweet that was not profiled
  return elastic.findTweet({
    'filtered': {
      'filter': {
        'bool': {
          'should': [
              // profiled is undefined
              {
                'missing': {
                  'field': 'profiled'
                }
              }
              ,
              // profiled = false
              {
                'term': {
                    'profiled': false
                }
              }
          ]
        }
      }
    }
  })
  .then(function(res){
    var hits = res.hits.hits;   // all twits
    if(hits.length !== 0){
      var allTweets = [];
      var allDocuments = [];

      // Loop throught twits array
      var loopCrawlingTweet = function(start){
        var unitTweet = hits.slice(start, start + 1);

        // no more twits
        if(unitTweet.length === 0){
          return Promise.resolve(allDocuments);
        }

        // Crawl twit
        return startCrawlingTweet(unitTweet[0])
          .then(function(document){
            // add document to document array
            allDocuments.push(document);
            return loopCrawlingTweet(start+1);
          })
          .catch(function(err){
            console.log(err);
          });
      }

      loopCrawlingTweet(0)  // start loop all twits
      .then(function(allDocuments){
        // return miningProfils();
      });
    } else {
      console.log('timeout');
      return (
        setTimeout(function(){
            return miningProfils();
        }, 5000)
      )
    }
  })
  .catch(function(err){
    console.log('tag1', err);
    // return miningProfils();
  });
}

var exploreUrlSync = function exploreUrlSync(url, twitterUserId, tweetId){
  return new Promise (function(resolve, reject){
    return resolve(exploreUrl(url, twitterUserId, tweetId));
    // return resolve(url);
  });
}

// Get twits from user tweet
var startCrawlingTweet = function startCrawlingTweet(tweet) {
  return new Promise (function (resolve, reject){
    var profileOld = null;
    return getProfilById(tweet._source.user.id)   // Get profil from tweet
      .then(function(profilInDB){
        profileOld = profilInDB;
        // Construct twitter request with profile informations
        var lastTweetId = profilInDB && profilInDB[0]._source && profilInDB[0]._source.lastTweetId;
        var lastTweetDate = profilInDB && profilInDB[0]._source && profilInDB[0]._source.lastTweetDate;

        // Check if the last twit is more than nbDayBeforeScrap. Avoid to crawl a account to frequently
        if(!profilInDB ||  Math.round( (Date.now() - lastTweetDate) / (24 * 60 * 60 * 1000) ) > nbDayBeforeScrap ) {
          return getTwitFromProfil(tweet._source.user.screen_name, lastTweetId);
        }
        return {oldProfil: profileOld};
      })
      .then(function(results){
        if(results.links){
          var links = results.links;
          var twitIds = results.twitIds;
          var i = 0;
          var allDocument = [];

          var concurrency = 5;


          var loop = function(start){
            // console.log(start, start + concurrency);
            var partialLinks = links.slice(start, start + concurrency);
            return Promise.all(partialLinks.map(function(link){
              return exploreUrlSync(link, tweet._source.user.id, tweet._source.id);
            }))
            .then(function(docs){
              allDocument = allDocument.concat(docs);
              if(partialLinks.length !== 0){
                return loop(start+concurrency);
              }
              return allDocument;
            });
          }

          return loop(0)
            .then(function(docs){
              /////////////////// TODO INSERT / UPDATE PROFILE IN DB //////////////
              ////////// lastTweetId / lastTweetDate //////////////////////////////
              var totalScore = 0;

              for(var j = 0, l = docs.length; j < l; j++){
                if(!docs[j].error && !!docs[j].nbWord ){
                  totalScore += docs[j].nbWord;
                }
              }

              if(profileOld){
                console.log('Update profile in database');
                var scriptUpdate = '';
                scriptUpdate += 'ctx._source.lastTweetId = lastTweetId; ';
                scriptUpdate += 'cts._source.lastTweetDate = lastTweetDate; ';
                scriptUpdate += 'ctx._source.nbDocument += nbDocument; ';
                scriptUpdate += 'ctx._source.totalTweetRelated += nbTweetAdded; ';
                scriptUpdate += 'ctx._source.ratio += ratio; ';
                return elastic.updateProfilCounter(
                  profileOld.id,
                  {
                    // update counters
                    script: scriptUpdate,
                    params: {
                      nbDocument: docs.length,
                      lastTweetId: twitIds[0],
                      lastTweetDate: snowflake2Utc(twitIds[0]),
                      ratio: (totalScore + profileOld._source.scoreTotal) / (docs.length + profileOld._source.nbDocument)
                    }
                  }
                ).then(function(){
                  return elastic.updateTweet(tweet._id, {profiled: true})
                });
              } else {
                console.log('Insert profile in database', tweet._source.user.screen_name);
                return elastic.insertProfil({
                  screen_name: tweet._source.user.screen_name,
                  userId: tweet._source.user.id,
                  nbDocument: docs.length,
                  scoreTotal: totalScore,
                  ratio: totalScore/docs.length,
                  lastTweetId: twitIds[0],
                  lastTweetDate: snowflake2Utc(twitIds[0])
                })
                .then(function(){
                  return elastic.updateTweet(tweet._id, {profiled: true})
                });
              }
              // return resolve(allDocument);
            })


        } else if(results.oldProfil){
          console.log('already parsed', tweet._id); // TODO WHY IT'S ALWAYS THE SAME ID ?
          return elastic.updateTweet(tweet._id, {profiled: true})
            .then(function(){
              return miningProfils();
            })
        }

      })
      .catch(function(err){
        console.log('err1', err);
      })
  });
}

var infinitMiningProfils = function(){
  try{
    // Mining profils
    miningProfils();
  } catch(error){
    miningProfils();
  }
}

infinitMiningProfils();
