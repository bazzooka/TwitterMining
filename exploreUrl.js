var request = require("request");
var cheerio = require("cheerio");
var franc = require('franc');
var html_strip = require('htmlstrip-native');

var config = require('./config.js');
// var regTopics = new RegExp(config.topics.join('|'), 'gi');
var minEnglishScore = 0.7;

var strip_options = {
	include_script : false,
	include_style : false,
	compact_whitespace : true
};

var exploreUrl = function exploreUrl(url){
  return new Promise(function(resolve, reject){
    try {
      var r = request({url: url, timeout: 1000 * 10}, function (error, response, html) {
        timerTimeout && clearTimeout(timerTimeout);

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

            if(textInEnglish(text)){
              // Split on spaces for a list of all the words on that page and
              // loop through that list.
              text.split(" ").forEach(function (word) {
                // We don't want to include very short or long words because they're
                // probably bad data.``
                if (config.topics[word]) {
                  nbWord++;
                }
              });


              // console.log({
              //   url: url,
              //   true_url: true_url,
              //   title: title.toString().trim(),
              //   nbWord: nbWord,
              //   crawled_at: Date.now()
              // });
              return resolve({
                url: url,
                true_url: true_url,
                title: title.toString().trim(),
                nbWord: nbWord,
                crawled_at: Date.now()
              });

            } else {
              return reject('not in english');
            }
          } catch(error){
            return reject(error);
          }
        } else {
          return reject(error);
        }
      });

      var timerTimeout = global.setTimeout(function( ) {
        r.abort();
        return reject('timeout');
      }, 5*1000);

    } catch(err){
      console.log(err);
      return reject(err);
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

exploreUrl('https://medium.com/free-stuff/2000-programming-resources-c2c835001216#.2e3v5d9b5');
