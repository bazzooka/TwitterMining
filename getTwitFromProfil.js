var request = require('request');
var cheerio = require ('cheerio');
var baseUrl = 'https://mobile.twitter.com/';
var maxTwitToCrawl = 100;

var header = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19'
  }

var getTwitFromProfil = function getTwitFromProfil(username, maxId){
  return new Promise(function(resolve, reject){
    var links = [];
    var nbTwitCrawled = 0;
    var nextPage = null;

    var recurGetTwitts = function(username, nextPageUrl, maxId){

      return requestTweets(username, nextPageUrl, maxId)
      .then((function(results){
        nbTwitCrawled += results.nbTwitCrawled;
        links = links.concat(results.links);
        nextPage = results.nextPage;
        if(maxTwitToCrawl >= nbTwitCrawled && !results.findedMaxId){
          return recurGetTwitts(username, nextPage, maxId);
        } else {
          // console.log(username);
          return resolve(links);
        }
      }));
    }

    recurGetTwitts(username, null, maxId);
  });
}

var requestTweets = function requestTweets(username, nextPageUrl, maxId){
  return new Promise(function(resolve, reject){
    var url = nextPageUrl ? (baseUrl + nextPageUrl) : (baseUrl + username);
// console.log(username, url);
    var r = request({url: url, header: header, timeout: 1000 * 10}, function (error, response, html) {

      var $ = cheerio.load(html)
      var allTweets = $('table.tweet');
      var nextPage = $('.w-button-more a').attr('href');

      if(allTweets.length === 0){
        return resolve({nbTwitCrawled: 0, nextPage: null, findedMaxId: true});
      }

      return resolve(getAllTweets(allTweets, maxId, nextPage));
    });
  })
}

var getAllTweets = function getAllTweet(allTweets, maxId, nextPage){
  return new Promise(function(resolve, reject){
    var findedMaxId = false;
    var nbTwitCrawled = 0;
    var allLinks = [];

    for(var i = 0, l = allTweets.length; i < l; i++){
      var twit = allTweets.slice(i, i+1).find('.tweet-text');
      var twitterId = twit.attr('data-id');
      var text = twit.text();
      var links = twit.find('a')
      if(maxId && twitterId === maxId){
        findedMaxId = true;
        break;
      } else {
        nbTwitCrawled++;
        for(var j = 0, n = links.length; j < n; j++){
          var link = links.slice(j, j+1).attr('href');
          if(link.indexOf('http') !== -1){
            allLinks.push(link);
          }
        }
      }
    }

    return resolve({
      links: allLinks,
      nbTwitCrawled: nbTwitCrawled,
      findedMaxId: findedMaxId,
      nextPage: nextPage
    });
  });
}

module.exports = getTwitFromProfil;

// getTwitFromProfil('likejj')
