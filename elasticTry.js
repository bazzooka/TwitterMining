var elasticsearch = require('elasticsearch');

var ElasticSearch = function (){
  var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
  });
  this.client = client;
  //return this;
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

ElasticSearch.prototype.ok = function(){
  console.log("ok");
}

ElasticSearch.prototype.insertTweet = function(){
  console.log('ok');
  //this.client.create({
  //  index: 'twitter',
  //  type: 'tweet_test',
  //  body: tweet
  //});
}

console.log(ElasticSearch.ping);

module.exports = ElasticSearch;

