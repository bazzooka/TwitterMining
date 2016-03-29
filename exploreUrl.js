var request = require("request");
var cheerio = require("cheerio");
var franc = require('franc');
var html_strip = require('htmlstrip-native');

var config = require('./config.js');
var ElasticSearch = require('./ElasticAPI');
var snowflake = require('./snowflake');
// var regTopics = new RegExp(config.topics.join('|'), 'gi');
var minEnglishScore = 0.7;
var timeoutLimit = 20; // In second

var strip_options = {
	include_script : false,
	include_style : false,
	compact_whitespace : true
};

var snowflake2Utc = snowflake.snowflake2Utc;
var elastic = new ElasticSearch();

var exploreUrl = function exploreUrl(url, twitterUserId, tweetId){
  return new Promise(function(resolve, reject){
    try {
      if(!url){
        return resolve({error: 'no url'});
      }
      var r = request({url: url, jar: true, timeout: 1000 * timeoutLimit, followAllRedirects: true}, function (error, response, html) {
        // timerTimeout && clearTimeout(timerTimeout);

        if (!error && response.statusCode == 200) {
          try{
            var $ = cheerio.load(html, {normalizeWhitespace: true});
            var title = $('title').text();
            var true_url = response.request.uri.href;

            // console.log(title);
            // console.log(url);

            // Get text
            var text = $('body').html(),
              nbWord = 0;


            // text = text//.replace(/\s+/g, " ")
            //   // .replace(/[^a-zA-Z ]/g, " ")
              // .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, ' ')
            //   .toLowerCase().trim();
            // text = text.replace(/<script.*>.*<\/script>/);
            text = html_strip.html_strip(text, strip_options);

            var topicsLength = config.topics.length;
            if(textInEnglish(text)){
              // Split on spaces for a list of all the words on that page and
              // loop through that list.
              text.split(" ").forEach(function (word) {
                // We don't want to include very short or long words because they're
                // probably bad data.``

                for(var i = 0; i < topicsLength; i++){
                  if(word.toLowerCase().trim().indexOf(config.topics[i]) >=0){
                    nbWord++;
                  }
                }
              });

              /////////// TODO INSERT IN DB /////////////////
              var document = {
                url: url,
                true_url: true_url,
                title: (title && title.toString) ? title.toString().trim() : true_url,
                nbWord: nbWord,
                twitterUserId: twitterUserId,
                tweetId: tweetId,
                postedAt: snowflake2Utc(tweetId),
                crawled_at: Date.now()
              };
              return elastic
                .insertDocument(document)
                .then(function(){
                  return resolve(document);
                });

            } else {
              return resolve({error: 'not in english'});
            }
          } catch(error){
            // console.log('exploreUrl error', url)
            return resolve({error : error});
          }
        } else {
          // console.log('request error', url);
          return resolve({error : error});
        }
      });

      // var timerTimeout = global.setTimeout(function( ) {
      //   r.abort();
      //   console.log('URL timeout', url);
      //   return resolve({error : 'timeout'});
      // }, timeoutLimit*1000);

    } catch(err){
      // console.log('tag', err);
      return resolve({error: err});
    }
  });
}

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


module.exports = exploreUrl;

// exploreUrl('https://medium.com/free-stuff/2000-programming-resources-c2c835001216#.2e3v5d9b5');
