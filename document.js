var mongodb = require('mongodb');
var auth = require('./auth.js');
var config = require('./config.js');

var Nightmare = require('nightmare');
var franc = require('franc');

var request = require("request");
var cheerio = require("cheerio");

var MongoClient = require('mongodb').MongoClient;
var db;



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
              var nightmare = new Nightmare({waitTimeout:10000})
                .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
                .goto(documents[doc_index])
                .wait(2000)
                // .screenshot('bandcamp2.png')
                .evaluate(function () {
                  return {
                    html: document.documentElement.innerHTML,
                    title: document.title,
                    url : window.location.href
                  }
                })
                .run(function (err, nightmare) {
                  if (err) return console.log(err);
                  var html = nightmare.html;
                  var title = nightmare.title;
                  var url = nightmare.url;
                  var $ = cheerio.load(html); //use cheerio for jqeury in node
                  var text = $('body').text(),
                    nbWord = 0;

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
                  if(crawledUrls === l){
                    db.close();
                    tryMiningDocuments();
                  }
                })
                .end(function(){
                  crawledUrls++;
                  console.log(crawledUrls, l);
                  // miningDocuments();

                });
              } catch (error){
                console.log(error);
              }

          })(i, doc);
        }
      }
    }
  );
}
