var elasticsearch = require('elasticsearch');

var myIndex = 'tweet_test';

var ElasticSearch = function (){
  var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
  });
  this.client = client;
 // return client;
}

ElasticSearch.prototype.ping = function(){
  this.client.ping({
    requestTimeout:30000,
    hello: "elasticsearch"
  }, function(error){
    if(error){
      console.error('elasticsearch cluster is down !');
    } else {
      console.log('All is well');
    }
 });
}

ElasticSearch.prototype.insertTweet = function(tweet){
  return this.client.create({
    index: myIndex,
    type: 'tweet',
    body: tweet
  });
}

ElasticSearch.prototype.findTweet = function(query){
  return this.client.search({
    index: myIndex,
    query: query
  })
}

ElasticSearch.prototype.existTweet = function(tweetId){
  return this.client.exists({
    index: myIndex,
    type: 'tweet',
    _id: tweetId 
  });

}

module.exports = ElasticSearch;
