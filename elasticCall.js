var ElasticSearch = require('./ElasticAPI');

var elastic = new ElasticSearch();

// elastic.ping();




// elastic.countTweet().then(function(res){console.log(res);})
// elastic.findTweet({
//   'filtered': {
//     'filter': {
//       'bool': {
//         'must': [
//             // profiled is undefined
//             {
//               'term': {
//                 '_id': 'AVMlM-aNLSNV_9wOg9Kv'
//               }
//             }
//         ]
//       }
//     }
//   }
// })
// .then(function(res){console.log(res.hits);})

elastic.updateTweet('AVMlM-aNLSNV_9wOg9Kv', {'profiled': true})


/*
elastic.insertTweet(
  {
    "id" : "697528016461832192",
    "text" : "Lol my mood all the time \"this BITCH js shaking the table \"LMAO  https://t.co/qyZ3YfiVVp",
    "urls" : [ "https://t.co/qyZ3YfiVVp" ],
    "retweet_count" : 0,
    "favorite_count" : 0,
    "timestamp_ms" : "1455138613225",
    "user" : {
      "id" : "4286164541",
      "name" : "Orlando Alvelo",
      "screen_name" : "Papisanto23",
      "statuses_count" : 546,
      "followers_count" : 83,
      "listed_count" : 0
    }
  }
).then(function(res){
  console.log(res);
}).catch(function(err){
  console.log(err);
});
*/
/*
elastic.findTweet({user: {name:'Orlando Alvelo'}})
.then(function(res){
  console.log(res.hits);
}).catch(function(err){
  console.log(err);
});
*/

//elastic.existTweet
