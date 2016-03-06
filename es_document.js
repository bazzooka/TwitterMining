var request = require("request");
var cheerio = require("cheerio");

var ElasticSearch = require('./ElasticAPI');
var config = require('./config.js');
var franc = require('franc');

var elastic = new ElasticSearch();
var regTopics = new RegExp(config.topics.join('|'), 'gi');
var minEnglishScore = 0.7;

var textInEnglish = function(text){
  var languages = franc.all(text);

  // get language
  for(var i = 0, ll = languages.length; i < ll; i++){
    if(languages[i][0] === 'eng'){
      if(languages[i][1] > minEnglishScore){
        return true;
      }
      return false;
    }
  }
  return false;
}

var miningDocuments = function(){
  console.log("request");

  elastic.findTweet({
    'filtered': {
      'filter': {
        'bool': {
          'should': [
              // profiled is undefined
              {
                'missing': {
                  'field': 'crawled'
                }
              }
              ,
              // profiled = false
              {
                'term': {
                    'crawled': false
                }
              }
          ]
        }
      }
    }
  }).then(function(res){
    var hits = res.hits.hits;

    if(hits.length !== 0){

      for(var i = 0, l = hits.length; i < l; i++){
        var tweet = hits[i]._source;
        if(textInEnglish(tweet.text) && tweet.urls && tweet.urls.length > 0){
          var documents = tweet.urls;
          var crawledUrls = 0;

          for(var d = 0, n = documents.length; d < n; d++){
            (function(doc_index, doc, fullTweet){
              console.log("scrap url ", documents[doc_index]);

              try {
                var r = request({url: documents[doc_index], timeout: 1000 * 10}, function (error, response, html) {
                  timerTimeout && clearTimeout(timerTimeout);

                  if (!error && response.statusCode == 200) {
                    try{
                      var $ = cheerio.load(html);
                      var title = $('title').text();
                      var url = response.request.uri.href;

                      // console.log(title);
                      // console.log(url);

                      // Get text
                      var text = $('body').text(),
                        nbWord = 0;

                      text = text.replace(/\s+/g, " ")
                        .replace(/[^a-zA-Z ]/g, "")
                        .toLowerCase();

                      if(textInEnglish(text)){
                        // Split on spaces for a list of all the words on that page and
                        // loop through that list.
                        text.split(" ").forEach(function (word) {
                          // We don't want to include very short or long words because they're
                          // probably bad data.
                          if (config.topics[word]) {
                            nbWord++;
                          }
                        });

                        return elastic.insertDocument({
                          tweet_id: doc.id,
                          url: documents[doc_index],
                          true_url: url,
                          title: title.toString().trim(),
                          user_id: doc.user.id,
                          screen_name: doc.user.screen_name,
                          nbWord: nbWord,
                          crawled_at: Date.now()
                        }).then(function(){
                          return elastic.updateTweet(doc.id, {
                            crawled: true
                          })
                        });
                      } else {
                        return elastic.updateTweet(doc.id, {
                          crawled: true,
                          foreign: true
                        });
                      }
                      crawledUrls++;
                      console.log(crawledUrls, l)
                      // if(crawledUrls === l){
                      //   // db.close();
                      //   tryMiningDocuments();
                      // }

                    } catch(error){
                      // db.collection('tweet').update(
                      //   {id: doc.id},
                      //   { $set: { "crawled" : true, "onError": true } },
                      //   {multi: true}
                      // );
                      // tryMiningDocuments();
                    }

                  } else {
                    console.log(error);
                    return elastic.updateTweet(doc.id, {
                      crawled: true,
                      onError: true
                    });
                  }
                });

                var timerTimeout = global.setTimeout(function( ) {
                  r.abort();
                  return elastic.updateTweet(hits[i], {
                    crawled: true,
                    onError: true
                  });
                  miningDocuments();
                }, 5*1000);

              } catch(err){
                console.log(err);
                miningDocuments();
              }
            })(d, tweet, hits[i]);

          }

        } else {
          console.log('not english', tweet.text);
          miningDocuments();
          return elastic.updateTweet(hits[i]._id, {
            crawled: true,
            foreign: true
          });
        }
      }
    }
  })
  .then(function(){
    setTimeout(function(){
      miningDocuments();
    }, 2000);
  })
  .catch(function(error){
    console.log(error);
  });
}

miningDocuments();
