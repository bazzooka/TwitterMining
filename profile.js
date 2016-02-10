// when get tweets, get nb retweet

var Twitter = require('twitter');
var mongodb = require('mongodb');
var auth = require('./auth.js');
var config = require('./config.js');

var client = new Twitter({
  consumer_key: auth.consumer_key_profil,
  consumer_secret: auth.consumer_secret_profil,
  access_token_key: auth.access_token_key_profil,
  access_token_secret: auth.access_token_secret_profil
});

var MongoClient = require('mongodb').MongoClient;
var db;
var regTopics = new RegExp(config.topics.join('|'), 'gi');


MongoClient.connect("mongodb://localhost:27017/twitter", function(err, database) {
  if(err) throw "DB connection error";

  db = database;

  tryMiningProfils();
});

var tryMiningProfils = function(){
  try{
    miningProfils();
  } catch(error){
    miningProfils();
  }
}

var miningProfils = function(){
  var profilsCursor = db.collection('tweet').find({ $or: [ { profiled: {$exists: false} }, { profiled : { $eq: false } } ]});
  var profils = [];

  profilsCursor.each((err, doc) => {
    if(err){
      console.log(err);
      throw err;
    }

    if (doc != null) {
       profils.push(doc);
    }
  });

  var interv = setInterval(() => {
    if(profils.length === 0){
      clearInterval(interv);
      tryMiningProfils();
    } else {
      var currentDoc = profils.pop();
      try {

        // Search in DB if the profil was not profiled before
        var wasProfiled = db.collection('profil').findOne({id: currentDoc.user.id}, (err, oldProfil) =>{
          if(err){
            throw err;
          }
          console.log('Mining profil', currentDoc.user.screen_name);
          var lastTweetId = null;
          if(oldProfil){
            lastTweetId = oldProfil.lastTweetId;
          }

          var reqParams = {'count': 100, 'exclude_replies': true, 'screen_name': currentDoc.user.screen_name};
          if(lastTweetId){
            reqParams.since_id = lastTweetId;
          }

          try {
            client.get('statuses/user_timeline', reqParams,  function(error, tweets, response){
              var scoreByTopic = 0;
              var retweetCount = 0;

              try {
                if(error) {
                  throw error;
                }
              } catch(error){
                return true;
              }

              for(var i = 0, l = tweets.length; i < l; i++){
                var matches = tweets[i].text.match(regTopics);
                if( matches && matches.length > 0) {
                  scoreByTopic += matches.length;
                  retweetCount += tweets[i].retweet_count;
                }
              }
              if(scoreByTopic){
                if(lastTweetId){
                  db.collection('profil').updateOne(
                    {id: currentDoc.user.id},
                    {
                      $currentDate: {
                        lastModified: true
                      },
                      $inc: { scoreByTopic: +scoreByTopic, retweetCount: +retweetCount },
                      $set: {
                        "profiled_at": Date.now(),
                        "lastTweetId": tweets[0].id
                      },
                      $currentDate: { "lastModified": true }
                    }, function(err, results) {

                    }
                  )
                } else {
                  db.collection('profil').insertOne({
                    id: currentDoc.user.id,
                    screen_name: currentDoc.user.screen_name,
                    scoreByTopic: scoreByTopic,
                    retweetCount: retweetCount,
                    lastTweetId: tweets[0].id,
                    profiled_at: Date.now()
                  })
                }

                db.collection('tweet').updateOne(
                  {_id: currentDoc._id},
                  {
                    $currentDate: {
                      lastModified: true
                    },
                    $set: { "profiled": true, "profiled_at": Date.now() },
                    $currentDate: { "lastModified": true }
                  }, function(err, results) {

                  }
                )
              }
            });
          } catch (error){
            console.log(error);

          }
        });

      } catch(error){
        console.log(error);
      }
    }
  }, 4500);
}