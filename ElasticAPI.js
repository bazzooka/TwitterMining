var elasticsearch = require('elasticsearch');

var tweetIndex = 'tweet_test';

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
    index: tweetIndex,
    type: 'tweet',
    body: tweet
  });
}

ElasticSearch.prototype.updateTweet = function(tweetId, newInfos){
  console.log(newInfos, tweetId);
  return this.client.update({
    index: tweetIndex,
    type: 'tweet',
    id: tweetId,
    body: {
      doc: newInfos
    }
  });
}

ElasticSearch.prototype.findTweet = function(query){
  return this.client.search({
    index: tweetIndex,
    body: {
      query: query
    }
  })
}

ElasticSearch.prototype.existTweet = function(tweetId){
  return this.client.exists({
    index: tweetIndex,
    type: 'tweet',
    _id: tweetId
  });
}

ElasticSearch.prototype.countTweet = function(){
  return this.client.count({
    index: tweetIndex
  });
}

module.exports = ElasticSearch;
