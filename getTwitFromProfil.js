var request = require('request');
var cheerio = require ('cheerio');
var baseUrl = 'https://mobile.twitter.com/';

var header = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19'
  }

var evaluateProfile = function evaluateProfile(username, maxId){
  return new Promise(function(resolve, reject){
    var urlParams = maxId ? ('?max_id=' + maxId) : '';
    var r = request({url: baseUrl + '/ReactJS_News' + urlParams, header: header, timeout: 1000 * 10}, function (error, response, html) {
      var $ = cheerio.load(html)
      var allTweets = $('table.tweet');
      return getAllTweets(allTweets);
    });
  });
}

var getAllTweets = function getAllTweet(allTweets){
  return new Promise(function(resolve, reject){
    for(var i = 0, l = allTweets.length; i < l; i++){
      var twit = allTweets.slice(i, i+1).find('.tweet-text');
      var twitterId = twit.attr('data-id');
      var text = twit.text();
      var links = twit.find('a')
      var allLinks = [];
      for(var j = 0, n = links.length; j < n; j++){
        var link = links.slice(j, j+1).attr('href');
        if(link.indexOf('http') !== -1){
          allLinks.push(link);
        }
      }
      console.log(allLinks);
    }
  });
}

evaluateProfile('ReactJS_News')
