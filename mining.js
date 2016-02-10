// var natural = require('natural');
// var twitterJSON = require('./twitter.json');
//
//
// console.log(JSON.parse(twitterJSON));

var Twitter = require('twitter');
var mongodb = require('mongodb');
var auth = require('./auth.js');
var config = require('./config.js');

var client = new Twitter({
  consumer_key: auth.consumer_key,
  consumer_secret: auth.consumer_secret,
  access_token_key: auth.access_token_key,
  access_token_secret: auth.access_token_secret
});

var MongoClient = require('mongodb').MongoClient;
var db;

var urlRegExp = new RegExp('https?:(?:/{1,3})([A-z0-9./-])*', 'gi');


MongoClient.connect("mongodb://localhost:27017/twitter", function(err, database) {
  if(err) throw "DB connection error";

  db = database;

  tryTweeter();

});

var tryTweeter = function(){
  try{
    listenTweeter();
  } catch(error){
    setTimeout(function(){
      listenTweeter();
    }, 16 * 1000 * 60); // Retry every 16 minutes API rate at 15min
  }
}

var listenTweeter = function(){
  /**
   * Stream statuses filtered by keyword
   * number of tweets per second depends on topic popularity
   **/
  client.stream('statuses/filter', {track: config.topics.join(',')},  function(stream){
    stream.on('data', function(tweet) {
      var to_save = {
        crawled: false,
        created_at : tweet.created_at,
        id: tweet.id_str,
        text: tweet.text,
        urls: tweet.text.match(urlRegExp),
        retweet_count: tweet.retweet_count,
        favorite_count: tweet.favorite_count,
        timestamp_ms: tweet.timestamp_ms,
        user: {
          id: tweet.user.id_str,
          name: tweet.user.name,
          screen_name: tweet.user.screen_name,
          statuses_count: tweet.user.statuses_count,
          followers_count: tweet.user.followers_count,
          listed_count: tweet.user.listed_count
        }
      }

      if(tweet.retweeted_status){
        to_save.created_at = tweet.retweeted_status.created_at;
        to_save.id = tweet.retweeted_status.id_str;
        to_save.retweet_user = {
          id: tweet.retweeted_status.user.id_str,
          name: tweet.retweeted_status.user.name,
          screen_name: tweet.retweeted_status.user.screen_name,
          statuses_count: tweet.retweeted_status.user.statuses_count,
          followers_count: tweet.retweeted_status.user.followers_count,
          listed_count: tweet.retweeted_status.user.listed_count,
        }
      }

      var myTweet = db.collection('tweet').findOne(
        {id: tweet.id_str},
        (err, tweet) => {
          if(!tweet){
            saveUserInDB(to_save);
          }
          // else {
          //   db.collection('tweet').updateOne(
          //     {id: tweet.id_str},
          //     { $inc: { "retweet_count" : 1 } }
          //   );
          // }
        }
      );

    });

    stream.on('error', function(error) {
      console.log(error);
      throw error
    });
  });
};

var saveUserInDB = function(tweet){
  db.collection('tweet').insertOne(tweet)
}
