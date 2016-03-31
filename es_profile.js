// when get tweets, get nb retweet

var Twitter = require('twitter');
var ElasticSearch = require('./ElasticAPI');
var auth = require('./auth.js');
var config = require('./config.js');
var franc = require('franc');
var getTwitFromProfil = require('./getTwitFromProfil');
var exploreUrl = require('./exploreUrl');
var snowflake = require('./snowflake');
var Queue = require('./queue');

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
var minEnglishScore = 0.7;
var nbDayBeforeScrap = 2;
var nbUserBeforeRecrawl = 5;
var lastUsersCrawled = new Queue(nbUserBeforeRecrawl);

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
      query: {
        filtered: {
          // query: {
          //   "match_all": {}
          // },
          filter: {
            term: { 'userId': profilId }
          }
        }
      }
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
              },
              {
                'missing': {
                  'field': 'was_analyzed'
                }
              }
              // ,
              // {
              //   'term': {
              //     'was_analyzed': false
              //   }
              // }
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

      // Check that user of the twit is not in the last crawled user
      // Hack to let elasticsearch do near real time (insert and index)
      var selectedTwit = hits[0];
      for(var i = 0, l = hits.length; i < l; i++){
        // console.log('selectedTwits', i, hits[i]._source.user.screen_name);
        if( lastUsersCrawled.list.indexOf(hits[i]._source.user.id) < 0 ){
          lastUsersCrawled.enqueue(hits[i]._source.user.id);
          selectedTwit = hits[i];
          break;
        }
      }
      var allDocuments = [];
      elastic
        .updateTweet(selectedTwit._id, {was_analyzed: true})
        .then(function(){
          return startCrawlingTweet(selectedTwit);
        })
        // then(function(res){
        //   console.log('aaz', res);
        // })
        // .then(function(document){
        //   // add document to document array
        //   allDocuments.push(document);
        //   return loopCrawlingTweet(start+1);
        // })
        // .then(function(allDocuments){
        //   // return miningProfils();
        // })
        .catch(function(err){
          console.log('tagi', err);
        });

    } else {
      console.log('timeout');
      return (
        setTimeout(function(){
            return miningProfils();
        }, 1000)
      )
    }
  })
  .catch(function(err){
    console.error('tag1', err);
    process.exit();
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
  var profileOld = null;
  return new Promise (function (resolve, reject){
    console.log('start crawl ', tweet._id, tweet._source.user.screen_name, tweet._source.user.id );
    return getProfilById(tweet._source.user.id)   // Get profil from tweet
      .then(function(profilInDB){
        profileOld = profilInDB ? profilInDB[0] : null;
        // Construct twitter request with profile informations
        var lastTweetId = profilInDB && profilInDB[0]._source && profilInDB[0]._source.lastTweetId;
        var lastTweetDate = profilInDB && profilInDB[0]._source && profilInDB[0]._source.lastTweetDate;

        // Check if the last twit is more than nbDayBeforeScrap. Avoid to crawl a account to frequently
        if(!profileOld ||  Math.round( (Date.now() - lastTweetDate) / (24 * 60 * 60 * 1000) ) >= nbDayBeforeScrap ) {
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
              var totalScore = 0;

              for(var j = 0, l = docs.length; j < l; j++){
                if(!docs[j].error && !!docs[j].nbWord ){
                  totalScore += docs[j].nbWord;
                }
              }

              if(profileOld){
                console.log('Update profile in database', tweet._source.user.screen_name);
                var scriptUpdate = '';
                scriptUpdate += 'ctx._source.lastTweetId = lastTweetId; ';
                scriptUpdate += 'ctx._source.lastTweetDate = lastTweetDate; ';
                scriptUpdate += 'ctx._source.nbDocument += nbDocument; ';
                scriptUpdate += 'ctx._source.ratio = ratio; ';
                return elastic.updateProfilCounter(
                  profileOld._id,
                  {
                    // update counters
                    script: scriptUpdate,
                    params: {
                      lastTweetId: twitIds[0] + '',
                      lastTweetDate: snowflake2Utc(twitIds[0]),
                      nbDocument: docs.length,
                      ratio: (totalScore + profileOld._source.scoreTotal) / (docs.length + profileOld._source.nbDocument)
                    }
                  }
                ).then(function(){
                  return elastic.updateTweet(tweet._id, {profiled: true/*, was_analyzed: false*/})
                })
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
                  return elastic.updateTweet(tweet._id, {profiled: true/*, was_analyzed: false*/})
                });
              }
              // return resolve(allDocument);
            })
        } else if(results.oldProfil){
          console.log('already parsed', tweet._id);
          return elastic.updateTweet(tweet._id, {profiled: true/*, was_analyzed: false*/})
        }

      })
      .then(function(){
        // loooooooop
        miningProfils();
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
