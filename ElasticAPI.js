var elasticsearch = require('elasticsearch');

var tweetIndex = 'twitter';

/** START TWEET API **/

var ElasticSearch = function (){
  var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: false //||'trace' 'debug'
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
  // console.log("2222222222", tweetId, newInfos);
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
    type: 'tweet',
    body: {
      query: query
    }
  })
}

ElasticSearch.prototype.findTweetById = function(id){
  return this.client.search({
    index: tweetIndex,
    type: 'tweet',
    body: {
      query: {
        ids:{
          values: [ id ]
        }
      }
    }
  })
}

ElasticSearch.prototype.existTweet = function(tweetId){
  return this.client.exists({
    index: tweetIndex,
    type: 'tweet',
    id: tweetId
  });
}

ElasticSearch.prototype.countTweet = function(){
  return this.client.count({
    index: tweetIndex
  });
}

ElasticSearch.prototype.deleteTweet = function(tweetId){
  return this.client.delete({
    index: tweetIndex,
    type: 'tweet',
    id: tweetId
  });
}
/** END TWEET API **/

/** START PROFIL API **/

ElasticSearch.prototype.insertProfil = function(profil){
  console.log('create profil');
  return this.client.create({
    index: tweetIndex,
    type: 'profil',
    body: profil
  });
}

ElasticSearch.prototype.updateProfil = function(profilId, doc){
  return this.client.update({
    index: tweetIndex,
    type: 'profil',
    id: profilId,
    body: {
      doc: doc
    }
  });
}

ElasticSearch.prototype.updateProfilScript = function(profilId, script){
  return this.client.update({
    index: tweetIndex,
    type: 'profil',
    id: profilId,
    body: script
  });
}

ElasticSearch.prototype.updateProfilCounter = function(profilId, script){
  return this.client.update({
    index: tweetIndex,
    type: 'profil',
    id: profilId,
    body: script
  });
}

ElasticSearch.prototype.findProfil = function(query){
  return this.client.search({
    index: tweetIndex,
    type: 'profil',
    body: query
  })
}

ElasticSearch.prototype.findProfilById = function(profilId){
  return this.client.search({
    index: tweetIndex,
    type: 'profil',
    id: profilId
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

ElasticSearch.prototype.findTweetProfil = function(query){
  return this.client.search({
    index: tweetIndex,
    type: 'tweetProfil',
    query
  })
}
/** END TWEET_PROFIL **/

/** START DOCUMENT **/
ElasticSearch.prototype.insertDocument = function(doc){
  return this.client.create({
    index: tweetIndex,
    type: 'document',
    body: doc
  });
}

ElasticSearch.prototype.findDocument = function(query){
  return this.client.search({
    index: tweetIndex,
    type: 'document',
    body: {
      query: query
    }
  })
}

/** END DOCUMENT **/

module.exports = ElasticSearch;
