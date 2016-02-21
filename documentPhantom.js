var mongodb = require('mongodb');
var auth = require('./auth.js');
var config = require('./config.js');

var phantom = require('phantom');
var franc = require('franc');

var request = require("request");
var cheerio = require("cheerio");

var MongoClient = require('mongodb').MongoClient;
var db;

var phantomTimer = 2000;

var tryMiningDocuments = function(){
  try{

    MongoClient.connect("mongodb://localhost:27017/twitter", function(err, database) {
      if(err) throw "DB connection error";

      db = database;

      miningDocuments();
    });

  } catch(error){
    miningDocuments();
  }
}

tryMiningDocuments();


var callbackPageResults = function(results){

}

var miningDocuments = function(){
  console.log("request");
  var myDoc = db.collection('tweet').findOne({
    $and : [
      {urls: {$ne: null}},
      {$or: [ { crawled: {$exists: false} }, { crawled : { $eq: false } } ]}
    ]},
    (err, doc) => {
      var documents = [];
      if(err){
        console.log(err);
        throw err;
      }
      if(doc && doc.urls && doc.urls.length > 0){
        documents = documents.concat(doc.urls);
        var l = documents.length,
        crawledUrls = 0;

        for(var i = 0; i < l; i++){
          (function(doc_index, docu){
            console.log("scrap url ", documents[doc_index], doc._id);
            try {
              phantom.create(function (ph) {
                ph.createPage(function (page) {
                  page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36');
                  page.open(documents[doc_index], function (status) {
                    console.log("URL : ", documents[doc_index],  status);
                    if (status !== 'success') {
                      console.error("phantom: error opening " + documents[doc_index], status);
                      ph.exit();
                      db.close();
                      tryMiningDocuments();
                    } else {
                      // timeOut
                      global.setTimeout(function () {
                          page.evaluate(function () {
                            return {
                              html: document.documentElement.innerHTML,
                              title: document.title,
                              url : window.location.href
                            }
                          }, function (result) {
                              ph.exit(); // EXTREMLY IMPORTANT



                              var html = result.html;
                              var title = result.title;
                              var url = result.url;
                              var $ = cheerio.load(html); //use cheerio for jqeury in node
                              var text = $('body').text(),
                                nbWord = 0;


                            // console.log(arguments);

                              // replace all non alpha numeric values
                              text = text.replace(/\s+/g, " ")
                                .replace(/[^a-zA-Z ]/g, "")
                                .toLowerCase();

                              var isENG = false;
                              var languages = franc.all(text);

                              for(var i = 0, ll = languages.length; i < 3 && i < ll; i++){
                                if(languages[i][0] === 'eng'){
                                  isENG = languages[i][0];
                                  break;
                                }
                              }

                              if(isENG){
                                // Split on spaces for a list of all the words on that page and
                                // loop through that list.
                                text.split(" ").forEach(function (word) {
                                  // We don't want to include very short or long words because they're
                                  // probably bad data.
                                  if (config.topics[word]) {
                                    nbWord++;
                                  }
                                });

                                db.collection('docs').insertOne({
                                  id: doc.id,
                                  url: documents[doc_index],
                                  true_url: url,
                                  title: title,
                                  user_id: doc.user.id,
                                  screen_name: doc.user.screen_name,
                                  nbWord: nbWord,
                                  lang: isENG,
                                  crawled_at: Date.now()
                                });

                                db.collection('tweet').update(
                                  {id: doc.id},
                                  { $set: { "crawled" : true } },
                                  {multi: true}
                                );
                              } else {
                                db.collection('tweet').update(
                                  {id: doc.id},
                                  { $set: { "crawled" : true, "foreign": true } },
                                  {multi: true}
                                );
                              }

                              crawledUrls++;
                              console.log(crawledUrls, l)
                              if(crawledUrls === l){
                                db.close();
                                tryMiningDocuments();
                              }






                          });
                      }, phantomTimer);
                    }
                  });
                });
              });
            } catch(err){
              console.log(err);
            }
          })(i, doc);
        }
      }
    }
  );
}
