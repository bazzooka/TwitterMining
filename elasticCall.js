var ElasticSearch = require('./ElasticAPI');

var elastic = new ElasticSearch();

// elastic.ping();



// elastic.findDocument().then(function(res){console.log(res.hits.hits);});

// elastic.findTweet({
//
//   'query': {
//     'filtered': {
//       'filter': {
//         'bool': {
//           'should': [
//               // profiled is undefined
//               {
//                 'missing': {
//                   'field': 'profiled'
//                 }
//               }
//               ,
//               // profiled = false
//               {
//                 'term': {
//                     'profiled': false
//                 }
//               },
//               {
//                 'missing': {
//                   'field': 'is_analyzing'
//                 }
//               },
//               // {
//               //   'term': {
//               //     'is_analyzing': false
//               //   }
//               // }
//           ]
//         }
//       }
//     }
//   }
// })
// .then(function(res){console.log(res);})
// .catch(function(err){
//   console.log(err);
// })

// elastic.client.search({
//   index: 'twitter',
//   type: 'profil',
//   body: {
//     sort: {
//       ratio: {
//         order: 'desc'
//       }
//     }
//   }
//
// }).then(function(res){
//   console.log(res.hits.hits[0]);
// })
// .catch(function(err){
//   console.log(err);
// })

elastic.client.search({
  index: 'twitter',
  type: 'profil',
  body: {
    sort: {
      ratio: {
        order: 'desc'
      }
    }
  }

}).then(function(res){
  console.log(res);
})
.catch(function(err){
  console.log(err);
})

// elastic.findTweet().then(function(res){
//   for(var i = 0, l = res.hits.hits.length; i < l ; i++){
//     console.log(res.hits.hits[i]._source.user.screen_name)
//   }
// });

// elastic.findTweetProfil().then(function(res){console.log(res);});


// elastic.findTweetById('AVPCvN2TdjCqbYXiLsG2')
// .then(function(res){console.log(res.hits.hits);});

// elastic.findProfil({
//   query: {
//     filtered: {
//       // query: {
//       //   "match_all": {}
//       // },
//       filter: {
//         term: { 'userId': 225758448 }
//       }
//     }
//   }
// })
// .then(function(res){
//   for(var i = 0, l = res.hits.hits.length; i < l ; i++){
//     console.log(res.hits.hits[i]._source.screen_name)
//   }
// })



// var findProfileRecursive = function() {
//   var findAllProfiles = function(size, from){
//     return elastic.findProfil({
//       "query" : {
//         "match_all" : {}
//       },
//       "size": size,
//       "from": from
//     })
//   }
//
//   elastic.client.count({
//     index: 'tweet_test',
//     type: 'profil'
//
//   }, function (err, response) {
//     var maxResponse = response.count;
//     var allProfiles = [];
//
//     var searchForIt = function(from){
//       findAllProfiles(5, from)
//       .then(function(response){
//         allProfiles = allProfiles.concat(response.hits.hits);
//         if(allProfiles.length < maxResponse){
//           return searchForIt(from+5);
//         } else {
//           var allScreenName = [];
//           for(var i = 0; i < allProfiles.length; i++){
//             allScreenName.push(allProfiles[i]._source.screen_name);
//           }
//           console.log(allScreenName.sort());
//         }
//       })
//     }
//     searchForIt(0);
//
//   });
// }






// elastic.client.search({
//   index: 'tweet_test',
//   type: 'profil',
//   body: {
//       query: {
//         filtered: {
//           // query: {
//           //   "match_all": {}
//           // },
//           filter: {
//             term: { 'userId': '22656287' }
//           }
//         }
//       }
//     }
//
// }).then(function(res){
//   console.log(res)
//   for(var i = 0, l = res.hits.hits.length; i < l ; i++){
//     console.log(res.hits.hits[i])
//   }
// })
// .catch(function(err){
//   console.log(err);
// })


// elastic.findProfil({
//   filtered: {
//     filter: {
//       term : {
//         userId: 'ABC'
//       }
//     }
//
//   }
// }).then(function(res){
//   console.log(res.hits.hits);
// })
// .catch(function(err){
//   console.log(err);
// })



// elastic.deleteTweet('AVMuBqxmLSNV_9wOg9OC')
// .then(function(res){
//
// }).catch(function(err){
//   console.log(err)
// })


// var scriptUpdate = '';
// scriptUpdate += 'ctx._source.lastTweetId = lastTweetId; ';
// scriptUpdate += 'ctx._source.lastTweetDate = lastTweetDate; ';
// scriptUpdate += 'ctx._source.nbDocument += nbDocument; ';
// // scriptUpdate += 'ctx._source.totalTweetRelated += nbTweetAdded; ';
// scriptUpdate += 'ctx._source.ratio += ratio; ';
// elastic.updateProfilCounter(
//   'AVO1hPyCdjCqbYXiLr62',
//   {
//     // update counters
//     script: scriptUpdate,
//     params: {
//       lastTweetId: '714438699635707904',
//       lastTweetDate: 1459170434279,
//       nbDocument: 4,
//       ratio: 7.380952380952381
//     }
//   }
// )
// .then(function(res){console.log(res);})
// .catch(function(error){console.log(error);})

// elastic.findTweet({
//   'filtered': {
//     'filter': {
//       'bool': {
//         'should': [
//             // profiled is undefined
//             {
//               'missing': {
//                 'field': 'profiled'
//               }
//             }
//             ,
//             // profiled = false
//             {
//               'term': {
//                   'profiled': false
//               }
//             }
//         ]
//       }
//     }
//   }
// })
// .then(function(res){console.log(res.hits.hits);})
// .catch(function(err){console.log(err);});


// elastic.updateTweet('AVMvM6kmLSNV_9wOg9XP', {profiled: false})
// .then(function(res){console.log(res);})
// .catch(function(error){console.log(error);})

// elastic.findProfilById('AVNG6W9RdjCqbYXiLoho')
// .then(function(res){console.log(res.hits.hits[0]);})
// .catch(function(error){console.log(error);})

// elastic.existTweet('AVNG3ko5djCqbYXiLogq').then(function(res){console.log(res);});


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

// elastic.updateTweet('AVMlM-aNLSNV_9wOg9Kv', {'profiled': true})


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
