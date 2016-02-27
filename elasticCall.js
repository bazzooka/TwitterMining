var ElasticSearch = require('./ElasticAPI');

var elastic = new ElasticSearch();

// elastic.ping();

/*
elastic.insertTweet({
  name: "joe",
  screename: "likejj"
}).then(function(res){
  console.log(res);
}).catch(function(err){
  console.log(err);
});
*/

elastic.findTweet({name:'joe'})
.then(function(res){
  console.log(res);
}).catch(function(err){
  console.log(err);
});

