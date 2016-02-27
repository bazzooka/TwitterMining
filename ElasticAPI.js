var elasticsearch = require('elasticsearch');

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
    index: 'tweet_test',
    type: 'tweet',
    body: tweet
  });
}

ElasticSearch.prototype.findTweet = function(query){
  return this.client.search({
    index: 'tweet_test',
    query: query
  })
}

module.exports = ElasticSearch;
