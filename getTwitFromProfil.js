var request = require('request');
var cheerio = require ('cheerio');
var baseUrl = 'https://mobile.twitter.com/';
var maxTwitToCrawl = 10;

var header = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19'
  }
/**
 * Get twit from a profil
 * @param {String} username of user
 * @param {String} maxId id of the last twit
 **/
var getTwitFromProfil = function getTwitFromProfil(username, maxId){
  return new Promise(function(resolve, reject){
    var links = [];
    var twitIds = [];
    var nbTwitCrawled = 0;
    var nextPage = null;

    /**
     * Get twit from username by page and maxId
     * {String} username twitter username
     * {String} nextPageUrl next page of twit
     * {String} maxId id of the last twit
     **/
    var recurGetTwitts = function(username, nextPageUrl, maxId){
      return requestTweets(username, nextPageUrl, maxId)
      .then(function(results){
        nbTwitCrawled += results.nbTwitCrawled;
        links = links.concat(results.links);
        twitIds = twitIds.concat(results.twitIds);
        nextPage = results.nextPage;
        if(maxTwitToCrawl >= nbTwitCrawled && !results.findedMaxId){
          return recurGetTwitts(username, nextPage, maxId);
        } else {
          // console.log(links.length, twitIds.length, 'OK3')
          return {links: links, twitIds: twitIds};
        }
      })
      .catch(function(err){
        console.log(err);
      });
    }

    return resolve(recurGetTwitts(username, null, maxId));
  });
}

/**
 * Parse with cheerio a page of user's twits
 * {String} username twitter username
 * {String} nextPageUrl next page of twit
 * {String} maxId id of the last twit
 **/
var requestTweets = function requestTweets(username, nextPageUrl, maxId){
  return new Promise(function(resolve, reject){
    var url = nextPageUrl ? (baseUrl + nextPageUrl) : (baseUrl + username);
    var r = request({url: url, jar: true, header: header, timeout: 1000 * 10}, function (error, response, html) {

      if(error){
        return reject(error);
      }

      var $ = cheerio.load(html)
      var allTweets = $('table.tweet');
      var nextPage = $('.w-button-more a').attr('href');

      // No twit => Stop crawling
      if(allTweets.length === 0){
        return resolve({nbTwitCrawled: 0, nextPage: null, findedMaxId: true});
      }
      return resolve(getAllTweetsFromPage(allTweets, maxId, nextPage));
    });
  })
}

/**
 * Parse a page of twits
 * {Array of DOM} allTweets is an array of DOM element that represent all tweet informations
 * {String} maxId if we crawl a twit with maxId stop the process
 * {String} nextPage the id of the next page
 **/
var getAllTweetsFromPage = function getAllTweetsFromPage(allTweets, maxId, nextPage){
  return new Promise(function(resolve, reject){
    var findedMaxId = false;
    var nbTwitCrawled = 0;
    var allLinks = [];
    var allTwitId = [];

    // Loop through all page's twits
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
          allTwitId.push(twitterId);
          if(link.indexOf('http') !== -1){
            allLinks.push(link);
          }
        }
      }
    }
    return resolve({
      links: allLinks,
      twitIds: allTwitId,
      nbTwitCrawled: nbTwitCrawled,
      findedMaxId: findedMaxId,
      nextPage: nextPage
    });
  });
}

module.exports = getTwitFromProfil;

// getTwitFromProfil('likejj')
