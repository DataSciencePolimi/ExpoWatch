var express = require('express');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('underscore');
var debug = require('debug')('server');
var Account = require('./model/account');

Promise.promisifyAll(mongoose);
Promise.promisifyAll(express);

var app = express();
var conf = require('./configuration/configuration.json');

var server = {};

app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));


function toUTC(dateString) {
  var date = new Date(dateString);

  return -date.getTimezoneOffset() * 60000 + Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());

}

function aggregateInstragram(callback) {


  Account
    .find()
    .where('social', 'instagram')
    .select({
      createdDate: 1,
      media: 1
    })
    .sort({
      'createdDate': 1
    })
    .exec(function(err, data) {
      if (err) {
        console.log(err);

        return callback();
      }

      var photoStats = [];

      _.each(data, function(snapshot) {
        var photos = snapshot.media;

        if (_.isUndefined(photos) || photos.length === 0) {
          return;
        }

        var likes = 0;

        _.each(photos, function(photo) {
          likes += photo.likes.count;
        });

        photoStats.push([toUTC(snapshot.createdDate), likes]);
      });

      return callback(null, photoStats);

    });

}

app.get('/delta', function(req, res) {
  var social = req.query.social;

  Account
    .find()
    .where('social', social)
    .select({
      createdDate: 1,
      likes: 1,
      followers: 1,
      followings: 1,
      social: 1,
      "raw.name": 1,
      "raw.username": 1
    })
    .sort({
      "createdDate": 1
    })
    .exec(function(err, result) {
      if (err) {
        console.log(err);

        return res.send(err);
      }

      console.log('data retrieved');

      var data = {};

      _.each(result, function(stat) {

        var key = stat.raw.name || stat.raw.username;

        if (!data[key]) {
          data[key] = [];
        }

        data[key].push([toUTC(stat.createdDate), stat.likes]);
      });

      var deltas = {};
      for (var k in data) {
        var stats = data[k];
        deltas[k] = [];
        for (var i = 1; i < stats.length; i++) {
          var delta = -stats[i - 1][1] + stats[i][1];
          deltas[k].push([stats[i][0], delta]);
        }
      }

      debug(deltas);
      return res.json(deltas);

    });

});

app.get('/stats', function(req, res) {

  var social = req.query.social;

  Account
    .find()
    .where('social', social)
    .select({
      createdDate: 1,
      likes: 1,
      followers: 1,
      followings: 1,
      social: 1,
      "raw.name": 1,
      "raw.username": 1
    })
    .sort({
      "createdDate": 1
    })
    .exec(function(err, result) {
      if (err) {
        console.log(err);

        return res.send(err);
      }

      console.log('data retrieved');
      var data = {};

      _.each(result, function(stat) {

        var key = stat.raw.name || stat.raw.username;

        if (!data[key]) {
          data[key] = [];
        }

        data[key].push([toUTC(stat.createdDate), stat.likes]);
      });

      debug(data);
      console.log('Sending the response');
      return res.json(data);
    });
});


// ENDPOINT PER GRAFICI

app.get('/followOverTime', function(req, res) {

  var social = req.query.social;
  var account = req.query.account;

  var AccountModel = server.db.collection('accounts');
  debug('Retrieving the snapshots');

  AccountModel.find({
      social: 'instagram',
      'raw.username': 'yourexpo2015'
    }, {
      'createdDate': true,
      'likes': true
    })
    .sort({
      "createdDate": 1
    })
    .toArray(function(err, results) {
      if (err) return debug(err);

      debug('snapshots retrieved');
      /*results = _.sortBy(results, function(e) {
        return e.createdDate;
      });*/

      debug('writing the file');

      res.json(JSON.stringify(results, null, 2));
    });
});


// UI

app.get('/', function(req, res) {
  res.render('index.jade');
});
app.get('/index', function(req, res) {
  res.render('index.jade');
});
app.get('/facebook', function(req, res) {
  res.render('stats.jade', {
    social: 'facebook'
  });
});
app.get('/twitter', function(req, res) {
  res.render('stats.jade', {
    social: 'twitter'
  });
});
app.get('/instagram', function(req, res) {
  res.render('stats.jade', {
    social: 'instagram'
  });
});

app.listen(3210, function() {

  console.log('Connecting to mongo');
  mongoose.connect(conf.db);
  server.db = mongoose.connection;

  console.log('Server up on port 3210');


});