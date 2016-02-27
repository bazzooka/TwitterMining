var Twitter = require('twitter');
var ElasticSearch = require('./ElasticAPI');
var auth = require('./auth.js');
var config = require('./config.js');

var client = new Twitter({
  consumer_key: auth.consumer_key,
  consumer_secret: auth.consumer_secret,
  access_token_key: auth.access_token_key,
  access_token_secret: auth.access_token_secret
});

var elastic = new ElasticSearch();


var urlRegExp = new RegExp('https?:(?:/{1,3})([A-z0-9./-])*', 'gi');

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
        console.log(tweet);
      } else {
        console.log(to_save.text);
      }

      // var myTweet = db.collection('tweet').findOne(
      //   {id: tweet.id_str},
      //   (err, tweet) => {
      //     if(!tweet){
      //       saveUserInDB(to_save);
      //     }
      //   }
      // );

    });
	
    stream.on('error', function(error) {
      console.log(error);
      throw error
    });
  });i
};

var infinitListenTwitter = function(){
  try{
    listenTweeter();
  } catch(error){
console.log(error);
    setTimeout(function(){
      listenTweeter();
    }, 16 * 1000 * 60); // Retry every 16 minutes API rate at 15min
  }
}

infinitListenTwitter();



// var saveUserInDB = function(tweet){
//   db.collection('tweet').insertOne(tweet)
// }
