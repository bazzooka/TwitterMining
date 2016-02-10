var Nightmare = require('nightmare');
var cheerio = require("cheerio");

var MongoClient = require('mongodb').MongoClient;
var db;



var miningDocuments = function miningDocuments() {
  for(var i = 0; i < 3; i++){
    var nightmare = new Nightmare()
      .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
      .goto('https://t.co/TdDU4Qw1kj')
      .wait(2000)
      // .screenshot('bandcamp2.png')
      .evaluate(function () {
        return document.documentElement.innerHTML;
      })
      .run(function (err, nightmare) {
        if (err) return console.log(err);
        var html = nightmare;
        var $ = cheerio.load(html); //use cheerio for jqeury in node
        var titles = $('body').text()
        console.log('OK'); //log out the array of job titles
        db.close();
        tryMiningDocuments();
      })
      .end (function(){
        console.log('end')

      })

  }
}

MongoClient.connect("mongodb://localhost:27017/twitter", function(err, database) {
  if(err) throw "DB connection error";

  db = database;

  tryMiningDocuments();
});

var tryMiningDocuments = function(){
  try{
    miningDocuments();
  } catch(error){
    miningDocuments();
  }
}
