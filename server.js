var express = require('express');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('underscore');
var debug = require('debug')('server');
var Account;

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
    .find({
      social: 'instagram'
    }, {
      createdDate: 1,
      media: 1
    })
    .sort({
      'createdDate': 1
    })
    .toArray(function(err, data) {
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
    .find({
      social: social
    }, {
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
    .toArray(function(err, result) {
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
    .find({
      social: social
    }, {
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
    .toArray(function(err, result) {
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

app.get('/followerOverTime', function(req, res) {


  Account.find({
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


      debug('writing the file');

      res.json(results);
    });
});

app.get('/photoOverTime', function(req, res) {

  debug('Retrieving the snapshots');

  var Photo = server.yourExpoDb.collection('photos');

  var query = [{
    $project: {
      id: "$providerId",
      timestamp: "$votes.timestamp"
    }
  }, {
    $unwind: "$timestamp"
  }, {
    $group: {
      _id: "$id",
      timestamp: {
        $first: "$timestamp"
      }
    }
  }, {
    $group: {
      _id: {
        year: {
          $year: "$timestamp"
        },
        month: {
          $month: "$timestamp"
        },
        day: {
          $dayOfMonth: "$timestamp"
        },
        hour: {
          $hour: "$timestamp"
        },

      },
      count: {
        $sum: 1
      }
    }
  }];

  Photo.aggregate(query, {}, function(err, results) {
    if (err) return debug(err);

    debug('snapshots retrieved');


    res.json(results);
  });



});

app.get('/likesOverTime', function(req, res) {


});


app.get('/followBackRatio', function(req, res) {

  var User = server.yourExpoDb.collection('igusers');

  User.find({
      'followed': true
    })
    .toArray(function(err, results) {
      if (err) return res.json(err);

      var count = 0;

      var Accounts = server.expoWatchDb.collection('accounts');

      Accounts
        .find({
          social: 'instagram',
          'raw.username': 'yourexpo2015'
        }, {
          'createdDate': true,
          'followersList': true
        })
        .toArray(function(err, data) {
          if (err) return debug(err);

          debug(results.length);

          var alreadyFollowers = 0;
          var followers = [];

          for (var i = 0; i < results.length; i++) {
            var followedUser = results[i];
            var stat = [];

            var date = followedUser.followedTimestamp;
            stat.push(followedUser.username);
            stat.push(date);

            var futureSnapshots = _.filter(data, function(r) {
              return r.createdDate > date;
            });

            var pastSnapshots = _.difference(data, futureSnapshots);

            var f = _.find(pastSnapshots, function(p) {
              var users = p.followersList;

              var user = _.find(users, function(u) {
                return u.username === followedUser.username;
              });

              return user !== undefined;
            });

            if (f) {
              alreadyFollowers++;
              continue;
            }


            if (!f) {
              var p = _.find(futureSnapshots, function(s) {
                var users = s.followersList;

                var user = _.find(users, function(u) {
                  return u.username === followedUser.username;
                });

                return user !== undefined;
              });



              if (p) {
                stat.push(p.createdDate);
                stat.push(p.createdDate - date);
                followers.push(stat);
                count++;
              }
            }
          }

          debug('Number of people that were already follower %s', alreadyFollowers);
          debug('Number of converted people %s', count);

          res.json(followers);


        });
    });
});

app.get('/likeBackRatio', function(req, res) {

  var User = server.yourExpoDb.collection('igusers');

  var alreadyActive = 0;

  User
    .find({
      'followed': true
    })
    .toArray(function(err, followedUsers) {

      var Photo = server.yourExpoDb.collection('photos');
      var results = [];

      var query = [{
        $project: {
          _id: 0,
          likers: 1
        }
      }, {
        $unwind: "$likers"
      }, {
        $unwind: "$likers.list"
      }, {
        $group: {
          _id: "$likers.list",
          likes: {
            $push: "$likers.timestamp"
          }
        }
      }, {
        $out: "likers"
      }];

      Photo
        .aggregate(query, {
          allowDiskUse: true
        }, function(err, users) {
          if (err) return res.json(err);

          var Liker = server.yourExpoDb.collection('likers');

          Liker
            .find()
            .toArray(function(err, likers) {

              debug(likers[0]);
              return res.json(likers[0]);
            });
        });

    });
});

app.get('/likeBackRatioLight', function(req, res) {

  var User = server.yourExpoDb.collection('igusers');
  var Liker = server.yourExpoDb.collection('likers');

  var results = [];
  var count = 0;
  var alreadyActive = 0;
  User
    .find({
      followed: true
    })
    .toArray(function(err, users) {
      if (err) return send.json(err);

      var usernames = _.map(users, function(u) {
        return u.username;
      });

      debug('Users retrieved');

      Liker
        .find({
          _id: {
            $in: usernames
          }
        })
        .toArray(function(err, likers) {
          if (err) return send.json(err);

          for (var i = 0; i < users.length; i++) {
            var u = users[i];
            var stat = [];
            var followedDate = u.followedTimestamp;

            var liker = _.find(likers, function(l) {
              return l._id === u.username;
            });

            if (!liker) continue;

            if (liker.likes[0] < followedDate) {
              alreadyActive++;
              continue;
            } else {
              count++;
              stat.push(u.username);
              stat.push(followedDate);
              stat.push(liker.likes[0]);
              stat.push(liker.likes[0] - followedDate);
              results.push(stat);
            }
          }

          debug('Followed users %s', users.length);
          debug('Already active %s', alreadyActive);
          debug('Converted %s', count);

          res.json(results);
        });
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
  var expoWatchConn = mongoose.createConnection(conf.dbExpoWatch);
  var yourExpoConn = mongoose.createConnection(conf.dbYourExpo);
  server.expoWatchDb = expoWatchConn;
  server.yourExpoDb = yourExpoConn;

  Account = server.expoWatchDb.collection('accounts');

  console.log('Server up on port 3210');


});