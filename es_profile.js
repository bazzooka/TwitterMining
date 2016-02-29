// when get tweets, get nb retweet

var Twitter = require('twitter');
var ElasticSearch = require('./ElasticAPI');
var auth = require('./auth.js');
var config = require('./config.js');
var franc = require('franc');

var client = new Twitter({
  consumer_key: auth.consumer_key_profil,
  consumer_secret: auth.consumer_secret_profil,
  access_token_key: auth.access_token_key_profil,
  access_token_secret: auth.access_token_secret_profil
});

var elastic = new ElasticSearch();
var regTopics = new RegExp(config.topics.join('|'), 'gi');
var urlRegExp = new RegExp('https?:(?:/{1,3})([A-z0-9./-])*', 'gi');

// var miningProfils = function(){
//   var profilsCursor = db.collection('tweet').find({ $or: [ { profiled: {$exists: false} }, { profiled : { $eq: false } } ]});
//   var profils = [];
//
//   profilsCursor.each((err, doc) => {
//     if(err){
//       console.log(err);
//       throw err;
//     }
//
//     if (doc != null) {
//        profils.push(doc);
//     }
//   });
//
//   var interv = setInterval(() => {
//     if(profils.length === 0){
//       clearInterval(interv);
//       tryMiningProfils();
//     } else {
//       var currentDoc = profils.pop();
//       try {
//
//         // Search in DB if the profil was not profiled before
//         var wasProfiled = db.collection('profil').findOne({id: currentDoc.user.id}, (err, oldProfil) =>{
//           if(err){
//             throw err;
//           }
//           console.log('Mining profil', currentDoc.user.screen_name);
//           var lastTweetId = null;
//           if(oldProfil){
//             lastTweetId = oldProfil.lastTweetId;
//           }
//
//           var reqParams = {'count': 100, 'exclude_replies': true, 'screen_name': currentDoc.user.screen_name};
//           if(lastTweetId){
//             reqParams.since_id = lastTweetId;
//           }
//
//           try {
//             client.get('statuses/user_timeline', reqParams,  function(error, tweets, response){
//               var scoreByTopic = 0;
//               var retweetCount = 0;
//
//               try {
//                 if(error) {
//                   throw error;
//                 }
//               } catch(error){
//                 return true;
//               }
//
//               for(var i = 0, l = tweets.length; i < l; i++){
//                 var matches = tweets[i].text.match(regTopics);
//                 if( matches && matches.length > 0) {
//                   scoreByTopic += matches.length;
//                   retweetCount += tweets[i].retweet_count;
//                 }
//               }
//               if(scoreByTopic){
//                 if(lastTweetId){
//                   db.collection('profil').updateOne(
//                     {id: currentDoc.user.id},
//                     {
//                       $currentDate: {
//                         lastModified: true
//                       },
//                       $inc: { scoreByTopic: +scoreByTopic, retweetCount: +retweetCount },
//                       $set: {
//                         "profiled_at": Date.now(),
//                         "lastTweetId": tweets[0].id
//                       },
//                       $currentDate: { "lastModified": true }
//                     }, function(err, results) {
//
//                     }
//                   )
//                 } else {
//                   db.collection('profil').insertOne({
//                     id: currentDoc.user.id,
//                     screen_name: currentDoc.user.screen_name,
//                     scoreByTopic: scoreByTopic,
//                     retweetCount: retweetCount,
//                     lastTweetId: tweets[0].id,
//                     profiled_at: Date.now()
//                   })
//                 }
//
//                 db.collection('tweet').updateOne(
//                   {_id: currentDoc._id},
//                   {
//                     $currentDate: {
//                       lastModified: true
//                     },
//                     $set: { "profiled": true, "profiled_at": Date.now() },
//                     $currentDate: { "lastModified": true }
//                   }, function(err, results) {
//
//                   }
//                 )
//               }
//             });
//           } catch (error){
//             console.log(error);
//
//           }
//         });
//
//       } catch(error){
//         console.log(error);
//       }
//     }
//   }, 4500);
// }

var textInEnglish = function(text){
  var languages = franc.all(text);

  // get language
  for(var i = 0, ll = languages.length; i < 3 && i < ll; i++){
    if(languages[i][0] === 'eng'){
      return true;
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
        console.log('TODO get last tweet getted for user id ', tweet.user.id);
        resolve(res.hits.hits);
      }
    }).catch(function(err){
      console.log(err);
      reject(err);
    });
  });
}

var getLastTweetOfProfil = function(tweetParent, profilInDB){
  return new Promise(function(resolve, reject){
    var reqParams = {'count': 100, 'exclude_replies': true, 'screen_name': tweetParent.user.screen_name};

    if(profilInDB){
      reqParams.since_id = tweetParent.user.lastTweetId;
    }

    try {
      client.get('statuses/user_timeline', reqParams,  function(error, tweets, response){
        if(error) {
          throw error;
        }

        // Tweet became profiled
        elastic.updateTweet(tweetParent._id, {profiled: true});

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
                id : tweet.retweeted_status.id_str,
                retweet_user : {
                  id: tweet.retweeted_status.user.id_str,
                  name: tweet.retweeted_status.user.name,
                  screen_name: tweet.retweeted_status.user.screen_name
                }
              }
            }

            if(textInEnglish(tweet.text)){
              nbTweetAdded++;
              elastic.insertTweetProfil(to_save);
            }
          }
        }

        if(nbTweetAdded > 0){
          var totalProceceedTweet = tweets.length;
          if(profilInDB){
            elastic.updateProfil(
              {
                // update counters
                inline: 'ctx._source.totalTweet += totalProceceedTweet; ctx._source.totalTweetRelated += nbTweetAdded'
              }, {
                // update last added tweet id
                lastTweetId: tweets[0].id
              }
            });
          } else {
            elastic.insertProfil({
              id: tweetParent.user.id,
              screen_name: tweetParent.user.screen_name,
              totalTweet: totalProceceedTweet,
              totalTweetRelated: nbTweetAdded,
              lastTweetId: tweets[0].id
            });
          }
        }

      });
    } catch(err){
      console.log(err);
    };

  });
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


    if(hits.length === 0){ // No results
      setTimeout(function(){
        infinitMiningProfils();
      }, 2 * 1000); // Try again in 2 minutes

    } else {
      for(var i = 0, l = hits.length; i < l; i++){
        // Does the tweet is in english ?
        var tweet = hits[i]._source;
        if(textInEnglish(tweet.text)){
          // Does the profil was already in database
          getProfilById(tweet.user.id)
            .then(function(res){
              return getLastTweetOfProfil(tweet, res);
            });
        } else {
          // Delete this foreign tweet
          elastic.deleteTweet(hits[i]._id);
        }
      }
    }

  }).catch(function(err){
    console.log(err);
      infinitMiningProfils();
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
