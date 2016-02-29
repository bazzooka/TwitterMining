var elasticsearch = require('elasticsearch');

var tweetIndex = 'tweet_test';

/** START TWEET API **/

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
  return this.client.update({
    index: tweetIndex,
    type: 'tweet',
    id: tweetId,
    body: {
      doc: newInfos
    }
  });
}

ElasticSearch.prototype.updateAllTweet = function(newInfos){
  return this.client.update({
    index: tweetIndex,
    type: 'tweet',
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

ElasticSearch.prototype.deleteTweet = function(tweetId){
  return this.client.update({
    index: tweetIndex,
    type: 'tweet',
    _id: tweetId
  });
}
/** END TWEET API **/

/** START PROFIL API **/

ElasticSearch.prototype.insertProfil = function(profil){
  return this.client.create({
    index: tweetIndex,
    type: 'profil',
    body: profil
  });
}

ElasticSearch.prototype.updateProfilCounter = function(profilId, script, doc){
  return this.client.update({
    index: tweetIndex,
    type: 'profil',
    id: profilId,
    script: script,
    doc: doc
  });
}

ElasticSearch.prototype.findProfil = function(query){
  return this.client.search({
    index: tweetIndex,
    type: 'profil',
    query
  })
}

ElasticSearch.prototype.findProfilById = function(profilId){
  return this.client.search({
    index: tweetIndex,
    type: 'profil',
    _id: profilId
  })
}

/** END PROFIL API **/

/** START TWEET_PROFIL **/
ElasticSearch.prototype.insertTweetProfil = function(newTweetProfil){
  return this.client.create({
    index: tweetIndex,
    type: 'tweetProfil',
    body: newTweetProfil
  });
}
/** END TWEET_PROFIL **/

module.exports = ElasticSearch;
