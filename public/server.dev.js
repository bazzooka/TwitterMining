var path = require('path');
var express = require('express');
var webpack = require('webpack');
var config = require('./webpack.dev.config');

var app = express();
var compiler = webpack(config);

var ElasticSearch = require('../ElasticAPI');
var elastic = new ElasticSearch();

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));

app.use('/public', express.static('public'));

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * Required params are
 * start {Integer} start
 * size {Integer} size of limit
 */
app.get('/getProfils', function(req, res) {
  var start = req.query.start;
  var size = req.query.size;

  return elastic.client.search({
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
    console.dir(res);
    res.send(res);
  })
  .catch(function(err){
    console.log(err);
  })

});

app.listen(3000, function(err) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
