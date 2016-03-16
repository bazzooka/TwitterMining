// when get tweets, get nb retweet

var Twitter = require('twitter');
var ElasticSearch = require('./ElasticAPI');
var auth = require('./auth.js');
var config = require('./config.js');
var franc = require('franc');
var getTwitFromProfil = require('./getTwitFromProfil');
var exploreUrl = require('./exploreUrl');

var client = new Twitter({
  consumer_key: auth.consumer_key_profil,
  consumer_secret: auth.consumer_secret_profil,
  access_token_key: auth.access_token_key_profil,
  access_token_secret: auth.access_token_secret_profil
});

var elastic = new ElasticSearch();
var regTopics = new RegExp(config.topics.join('|'), 'gi');
var urlRegExp = new RegExp('https?:(?:/{1,3})([A-z0-9./-])*', 'gi');
var nbTweetToGetFromProfile = 2;
var dayBeforeProfilReparsing = 2;
var minEnglishScore = 0.7;

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
  elastic.findTweet({
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
    var hits = res.hits.hits;
    if(hits.length !== 0){
      var allTweets = [];
      for(var i = 0, l = hits.length; i < l; i++){
        allTweets.push(startCrawlingTweet(hits[i]));
        // Does the tweet is in english ?
        // var tweet = hits[i]._source;
        // // if(textInEnglish(tweet.text)){
        //   // Does the profil was already in database
        //   return getProfilById(tweet.user.id)
        //     .then(function(res){
        //
        //       if(!res){   // Profil is unknown
        //         return getLastTweetOfProfil(hits[i], res);
        //       } else if((Date.now() - res[0]._source.lastParsingDate) > (24 * 60 * 60 * dayBeforeProfilReparsing)) {
        //         // profil was profiled more than dayBeforeProfilReparsing
        //         return getLastTweetOfProfil(hits[i], res);
        //       } else {
        //         return null;
        //       }
        //     });
            //
      // }
      }
      Promise.all(allTweets)
      .then(function(results){
        console.log(results)
      })
    }
  })
  .catch(function(err){
    console.log('tag1', err);
    // infinitMiningProfils();
  });
}

var exploreUrlSync = function exploreUrlSync(url){
  return new Promise (function(resolve, reject){
    return resolve(exploreUrl(url));
    // return resolve(url);
  });
}

var startCrawlingTweet = function startCrawlingTweet(tweet) {
  return new Promise (function (resolve, reject){
    return getProfilById(tweet._source.user.id)
      .then(function(profilInDB){
        var lastTweetId = profilInDB && profilInDB[0]._source && profilInDB[0]._source.lastTweetId;
        return getTwitFromProfil(tweet._source.user.screen_name, lastTweetId);
      })
      .then(function(links){
        if(links && links.length){
          // return Promise.all(links.map(exploreUrl));
          var i = 0;
          var allDocument = [];

          var concurrency = 5;


          var loop = function(start){
            // console.log(start, start + concurrency);
            var partialLinks = links.slice(start, start + concurrency);
            return Promise.all(partialLinks.map(exploreUrlSync))
              .then(function(docs){
                allDocument = allDocument.concat(docs);
                if(partialLinks.length !== 0){
                  return loop(start+concurrency);
                }
              });
          }

          return loop(0)
            .then(function(doc){
              console.log(tweet._source.user.screen_name, allDocument[0]);
            })


        }
        return null;
      })
      .then(function(document){
        console.log('document', tweet._source.user.screen_name);
      })
      .catch(function(err){
        console.log(err);
      })
  });
}

var infinitMiningProfils = function(){
  try{
    miningProfils();
  } catch(error){
    miningProfils();
  }
}

infinitMiningProfils();
