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
      social: 1
    })
    .sort({
      "createdDate": 1
    })
    .exec(function(err, result) {
      if (err) {
        debug(err);

        return res.send(err);
      }

      debug('data retrieved');

      var data = {};

      data[social] = [];

      for (var i = 1; i < result.length; i++) {
        var delta = result[i].likes - result[i - 1].likes;
        var date = result[i].createdDate;

        data[social].push([toUTC(date), delta]);
      }

      return res.json(data);

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
      media: 1
    })
    .sort({
      "createdDate": 1
    })
    .exec(function(err, result) {
      if (err) {
        debug(err);

        return res.send(err);
      }

      debug('data retrieved');
      var data = {};

      _.each(result, function(stat) {

        if (!data[stat.social]) {
          data[stat.social] = [];
        }

        data[stat.social].push([toUTC(stat.createdDate), stat.likes]);
      });

      /*data[social] = _.sortBy(data[social], function(elem) {
        return elem[0];
      });*/

      if (social === 'instagram') {
        debug('Retrievign iamges stat')
        return aggregateInstragram(function(err, result) {
          if (result) {
            data.photoStats = result;

            return res.json(data);
          }

          return res.json(data);
        });
      } else {
        debug('Sending the response');
        return res.json(data);
      }


    });
});

app.get('/', function(req, res) {
  res.render('index.jade');
});
app.get('/index', function(req, res) {
  res.render('index.jade');
});
app.get('/facebook', function(req, res) {
  res.render('facebook.jade');
});
app.get('/twitter', function(req, res) {
  res.render('twitter.jade');
});
app.get('/instagram', function(req, res) {
  res.render('instagram.jade');
});

app.listen(3210, function() {

  console.log('Connecting to mongo');
  mongoose.connect(conf.db);
  server.db = mongoose.connection;

  console.log('Server up on port 3210');


});