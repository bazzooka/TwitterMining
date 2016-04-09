var path = require('path');
var express = require('express');
var json = require('express-json');
var webpack = require('webpack');
var config = require('./webpack.dev.config');

var app = express();
var compiler = webpack(config);

var ElasticSearch = require('../ElasticAPI');
var elastic = new ElasticSearch();

app
  .use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }))
  .use(json())

app.use(require('webpack-hot-middleware')(compiler));

app.use('/public', express.static('public'));


/**
 * Required params are
 * start {Integer} start
 * size {Integer} size of limit
 */
app.get('/getProfils', function(req, res) {
  var start = req.query.start;
  var size = req.query.size;

  elastic.client.search({
    index: 'twitter',
    type: 'profil',
    from: start || 0,
    size: size || 1,
    body: {
      sort: {
        ratio: {
          order: 'desc'
        }
      }
    }

  }).then(function(response){
    res.json({response: response});
  })
  .catch(function(err){
    console.log('err1', err);
  })
});

/**
 * Required params are
 * start {Integer} start
 * size {Integer} size of limit
 */
app.get('/getDocuments', function(req, res) {
  var start = req.query.start;
  var size = req.query.size;

  elastic.client.search({
    index: 'twitter',
    type: 'document',
    from: start || 0,
    size: size || 1,
    body: {
      sort: {
        nbWord: {
          order: 'desc'
        }
      }
    }

  }).then(function(response){
    res.json({response: response});
  })
  .catch(function(err){
    console.log('err2', err);
  })
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});



app.listen(3000, function(err) {
  if (err) {
    console.log('err3', err);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
