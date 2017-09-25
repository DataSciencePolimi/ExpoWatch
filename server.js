var express = require('express');
var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('underscore');
var debug = require('debug')('server');
var async = require('async');
var fs = require('fs');
var Account;

Promise.promisifyAll(mongoose);
Promise.promisifyAll(express);

var app = express();
var conf = require('./configuration/configuration.json');

var server = {};

var HOUR = 3600000;
var challengeMap = {
  "EXPO2015oggidomani": ["2015-02-14 00:00:00.000Z", "2015-02-21 00:00:00.000Z"],
  "EXPO2015dolceamaro": ["2015-02-07 00:00:00.000Z", "2015-02-14 00:00:00.000Z"],
  "EXPO2015nightday": ["2015-01-31 00:00:00.000Z", "2015-02-07 00:00:00.000Z"],
  "EXPO2015italianlife": ["2015-01-24 00:00:00.000Z", "2015-01-31 00:00:00.000Z"],
  "EXPO2015fastslow": ["2015-01-17 00:00:00.000Z", "2015-01-24 00:00:00.000Z"],
  "EXPO2015gustomondo": ["2015-01-10 00:00:00.000Z", "2015-01-17 00:00:00.000Z"],
  "EXPO2015stuporesapore": ["2015-01-03 00:00:00.000Z", "2015-01-10 00:00:00.000Z"],
  "EXPO2015artfun": ["2014-12-27 00:00:00.000Z", "2015-01-03 00:00:00.000Z"],
  "EXPO2015showcooking": ["2014-12-20 00:00:00.000Z", "2014-12-27 00:00:00.000Z"],
  "EXPO2015cibovita": ["2014-12-13 00:00:00.000Z", "2014-12-20 00:00:00.000Z"],
  "EXPO2015terramare": ["2014-12-07 00:00:00.000Z", "2014-12-13 00:00:00.000Z"]
}
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

      res.json(results);
    });
});

app.get('/photoOverTime', function(req, res) {

  debug('Retrieving the snapshots');

  var Photo = server.yourExpoDb.collection('photos');

  /*var tags = [
    "EXPO2015artfun",
    "EXPO2015cibovita",
    "EXPO2015dolceamaro",
    "EXPO2015fastslow",
    "EXPO2015gustomondo",
    "EXPO2015italianlife",
    "EXPO2015nightday",
    "EXPO2015oggidomani",
    "EXPO2015showcooking",
    "EXPO2015stuporesapore",
    "EXPO2015terramare"
  ];*/

  var tags = ["EXPO2015oggidomani"];

  var getPhotos = function(tag, callback) {
    /*var query = [{
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
       $sort: {
         "timestamp": 1
       }
     }];

     if (tag) {
       query.unshift({
         $match: {
           tag: tag
         }
       });
     }*/

    var query = {
      tag: "EXPO2015oggidomani",
    };

    /*return Photo.aggregate(query, {}, function(err, results) {
      if (err) return callback(err);

      debug('snapshots retrieved for tag %s', tag);

      fs.writeFile(tag + 'photos.json', JSON.stringify(results, null, 2), callback);
    });*/


    return Photo
      .find(query, {
        providerId: 1,
        votes: 1
      })
      .toArray(function(err, results) {
        if (err) return callback(err);

        var data = _.map(results, function(r) {
          return {
            timestamp: r.votes[0].timestamp,
            providerId: r.providerId
          };
        });

        return callback();
        //return fs.writeFile(tag + 'photos.json', JSON.stringify(data, null, 2), callback);

      });
  };

  async.each(tags, getPhotos, function(err) {
    if (err) return res.json(err);

    res.send("OK");
  });



});

app.get('/likesOverTime', function(req, res) {

  debug('asdasd');
  var Vote = server.yourExpoDb.collection('votes');

  var tags = [
    "EXPO2015artfun",
    "EXPO2015cibovita",
    "EXPO2015dolceamaro",
    "EXPO2015fastslow",
    "EXPO2015gustomondo",
    "EXPO2015italianlife",
    "EXPO2015nightday",
    "EXPO2015oggidomani",
    "EXPO2015showcooking",
    "EXPO2015stuporesapore",
    "EXPO2015terramare"
  ];

  var csv = '';
  var map = [];
  var header = 'timestamp,count,tag\n';
  csv += header;

  var getLikes = function(tag, callback) {

    debug(tag);

    var query = [{
      $match: {
        tag: tag
      }
    }, {
      $group: {
        _id: {
          day: {
            $dayOfMonth: "$timestamp"
          },
          month: {
            $month: "$timestamp"
          },
          year: {
            $year: "$timestamp"
          },
          providerId: "$providerId",
        },
        votes: {
          $max: "$votes"
        }
      }
    }, {
      $group: {
        _id: {
          day: "$_id.day",
          year: "$_id.year",
          month: "$_id.month"
        },
        votes: {
          $sum: "$votes"
        }
      }
    }];


    Vote
      .aggregate(query, {
        allowDiskUse: true
      }, function(err, results) {
        if (err) return callback(err);

        results = _.map(results, function(r) {
          return {
            timestamp: r._id.year + '-' + r._id.month + '-' + r._id.day,
            providerId: r._id.providerId,
            votes: r.votes
          };
        });

        results = _.sortBy(results, function(t) {
          return t.timestamp;
        });


        for (var i = 0; i < results.length; i++) {
          var t = results[i];

          csv += [t.timestamp, t.votes, tag].join(',') + '\n';
        }

        return callback();


      });



  };

  return async.each(tags, getLikes, function(err) {
    if (err) return res.json(err);

    debug('writing the csv');
    fs.writeFileSync('instagramLikev4.csv', csv);
    return res.json({});
  });


  /*Photo
    .find({}, {
      providerId: 1,
      votes: 1,
      _id: 0
    })
    .toArray(function(err, results) {

      var map = {};
      var likes = [];
      var timestamps = [];

      debug('creating the array of votes - photo - timestamp');
      for (var i = 0; i < results.length; i++) {
        var p = results[i];

        debug('parsing votes of photo %s', p.providerId);
        var votes = p.votes;

        for (var j = 0; j < votes.length; j++) {
          var v = votes[j];

          timestamps.push({
            providerId: p.providerId,
            timestamp: v.timestamp,
            votes: v.votes
          });
        }

      }

      timestamps = _.sortBy(timestamps, function(t) {
        return t.timestamp;
      });

      debug('computing the cumulative');
      var count = 0;
      var csv = '';
      var header = 'timestamp,count\n';
      csv += header;
      for (var i = 0; i < timestamps.length; i++) {
        var t = timestamps[i];

        if (!map[t.providerId]) {
          map[t.providerId] = t.votes;
          count += t.votes;
        } else {
          if (map[t.providerId] > t.votes) {
            var old = map[t.providerId];
            map[t.providerId] = t.votes;
            count += (t.votes - old);
          }
        }

        csv += [t.timestamp, count].join(',') + '\n';
      }

      //global.gc();
      debug('writing the csv');

      fs.writeFileSync('instagramLike.csv', csv);
      return res.json({});
    });*/

});


app.get('/followTofollowBackRatio', function(req, res) {

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

          debug(data.length);

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

          debug('Followed users %s', results.length);
          debug('Number of people that were already follower %s', alreadyFollowers);
          debug('Number of converted people %s', count);


          var histogram = [0, 0, 0, 0, 0, 0];

          for (var i = 0; i < followers.length; i++) {
            var f = followers[i];

            var category = parseInt(f[3] / HOUR);

            debug(category);
            if (category < 6) {
              histogram[category] ++;
            }
          }
          res.json(histogram);


        });
    });
});

app.get('/followTolikeBackRatio', function(req, res) {

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
          likers: 1,
          providerId: 1
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

app.get('/followToLikeBackRatioLight', function(req, res) {

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

          var histogram = [0, 0, 0, 0, 0, 0];

          for (var i = 0; i < results.length; i++) {
            var f = results[i];

            var category = parseInt(f[3] / HOUR);

            debug(category);
            if (category < 6) {
              histogram[category] ++;
            }
          }
          res.json(histogram);
        });
    });

});



app.get('/likeToFollowBackRatio', function(req, res) {

  var Photo = server.yourExpoDb.collection('photos');
  var Account = server.expoWatchDb.collection('accounts');


  var query = [{
    $match: {
      liked: true
    }
  }, {
    $project: {
      "username": 1,
      "likedTimestamp": 1
    }
  }, {
    $sort: {
      "likedTimestamp": 1
    }
  }, {
    $group: {
      _id: "$username",
      likes: {
        $push: "$likedTimestamp"
      },
      count: {
        $sum: 1
      }
    }
  }, {
    $sort: {
      "count": -1
    }
  }];

  var followersQuery = [{
    $match: {
      social: 'instagram',
      'raw.username': 'yourexpo2015',
      followersList: {
        $ne: null
      }
    }
  }, {
    $project: {
      "followersList.username": 1,
      "createdDate": 1
    }
  }, {
    $unwind: "$followersList"
  }, {
    $sort: {
      "createdTimestamp": 1
    }
  }, {
    $group: {
      _id: "$followersList.username",
      timestamp: {
        $first: "$createdDate"
      }
    }
  }];

  Photo
    .aggregate(query, {
      allowDiskUse: true
    }, function(err, likedUsers) {
      if (err) return res.json(err);

      Account
        .aggregate(followersQuery, {
          allowDiskUse: true
        }, function(err, followers) {
          if (err) return res.json(err);

          var results = [];
          var totalLiked = [];
          var old = [];
          var alreadyCounted = [];
          var alreadyFollower = 0;

          var MAX_LIKE = 111;

          var createHistogram = function(numberOfLike) {
            var histogram = [];

            _.times(MAX_LIKE, function() {
              histogram.push(0);
            })

            var users = _.filter(likedUsers, function(l) {
              return l.count >= numberOfLike;
            });

            debug('%s users received at least %s likes', users.length, numberOfLike);
            var numberOfUsers = users.length;

            for (var i = 0; i < users.length; i++) {
              var u = users[i];


              var follower = _.find(followers, function(f) {
                return f._id === u._id;
              });

              if (!follower) continue;

              /*if (alreadyCounted.indexOf(u._id) !== -1) {
                debug('%s already counted', u._id);
                //numberOfUsers--;
                continue;
              }*/


              var followedDate = follower.timestamp;

              var times = _.map(u.likes, function(l) {
                return followedDate - l;
              });

              if (times[0] < 0) {
                alreadyFollower++;
                for (var k = 0; k < likedUsers.length; k++) {
                  if (likedUsers[k]._id === u._id) {
                    likedUsers.splice(k, 1);
                    break;
                  }
                }
                continue;
              }



              var min = times[0];
              var idx = 0;
              for (var j = 0; j < times.length; j++) {
                var t = times[j];

                if (t > 0 && t < min) {
                  min = t;
                  idx = j;
                }
              }

              //alreadyCounted.push(u._id);

              for (var k = 0; k < likedUsers.length; k++) {
                if (likedUsers[k]._id === u._id) {
                  likedUsers.splice(k, 1);
                  break;
                }
              }
              histogram[idx] ++;
            }
            totalLiked.push(numberOfUsers);

            //debug(histogram);
            debug('%s were already followers', alreadyFollower);
            return histogram;
          };

          for (var i = 1; i <= MAX_LIKE; i++) {

            results.push(createHistogram(i));
            old.push(alreadyFollower);
            alreadyFollower = 0;

          }

          var data = [];

          _.times(MAX_LIKE, function() {
            data.push(0);
          })

          // Sommo gli istogrammi
          for (var i = 0; i < results.length; i++) {
            var h = results[i];

            for (var j = 0; j < h.length; j++) {
              var element = h[j];
              data[j] += element;


            }
          }

          /*for (var i = totalLiked.length - 1; i > 0; i--) {
            var v = totalLiked[i];
            totalLiked[i - 1] += v;
          };*/

          /*for (var i = old.length - 1; i > 0; i--) {
            var v = old[i];
            old[i - 1] += v;
          };*/

          res.json([data, totalLiked, old]);
        });

    });


  /*Photo
    .find({
      liked: true
    }, {
      username: 1,
      likedTimestamp: 1
    }, {
      sort: "likedTimestamp"
    })
    .toArray(function(err, likedUsers) {
      if (err) return res.json(err);

      var Account = server.expoWatchDb.collection('accounts');

      Account
        .find({
          social: 'instagram',
          'raw.username': 'yourexpo2015'
        }, {
          'createdDate': true,
          'followersList': true
        })
        .toArray(function(err, data) {
          if (err) return debug(err);


          var alreadyFollowers = 0;
          var followers = [];
          var liked = [];
          var count = 0;
          for (var i = 0; i < likedUsers.length; i++) {
            var likedUser = likedUsers[i];
            var stat = [];

            var date = likedUser.likedTimestamp;

            var follower = _.find(liked, function(f) {
              return f === likedUser.username;
            });

            if (follower) {
              debug('User %s already liked', likedUser.username);
              continue;
            }

            debug("First like on %s", likedUser.username);
            liked.push(likedUser.username);

            stat.push(likedUser.username);
            stat.push(date);

            var futureSnapshots = _.filter(data, function(r) {
              return r.createdDate > date;
            });

            var pastSnapshots = _.difference(data, futureSnapshots);

            var f = _.find(pastSnapshots, function(p) {
              var users = p.followersList;

              var user = _.find(users, function(u) {
                return u.username === likedUser.username;
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
                  return u.username === likedUser.username;
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

          debug('Liked user %s', liked.length);
          debug('Number of people that were already follower %s', alreadyFollowers);
          debug('Number of converted people %s', count);

          var histogram = [0, 0, 0, 0, 0, 0];

          for (var i = 0; i < followers.length; i++) {
            var f = followers[i];

            var category = parseInt(f[3] / HOUR);

            debug(category);
            if (category < 6) {
              histogram[category] ++;
            }
          }
          res.json(histogram);
        });
    });*/
});

app.get('/likeToLikeBackLight', function(req, res) {

  var Photo = server.yourExpoDb.collection('photos');
  Photo
    .find({
      liked: true
    }, {
      username: 1,
      likedTimestamp: 1
    }, {
      sort: "likedTimestamp"
    })
    .toArray(function(err, likedUsers) {

      var Liker = server.yourExpoDb.collection('likers');

      var usernames = _.map(likedUsers, function(u) {
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

          var liked = [];
          var results = [];
          var alreadyActive = 0;
          var count = 0;

          for (var i = 0; i < likedUsers.length; i++) {
            var u = likedUsers[i];
            var stat = [];
            var likedDate = u.likedTimestamp;

            var luser = _.find(liked, function(f) {
              return f === u.username;
            });

            if (luser) {
              debug('User %s already liked', u.username);
              continue;
            }

            liked.push(u.username);
            var liker = _.find(likers, function(l) {
              return l._id === u.username;
            });

            if (!liker) continue;

            if (liker.likes[0] < likedDate) {
              alreadyActive++;
              continue;
            } else {
              count++;
              stat.push(u.username);
              stat.push(likedDate);
              stat.push(liker.likes[0]);
              stat.push(liker.likes[0] - likedDate);
              results.push(stat);
            }
          }

          debug('Followed users %s', liked.length);
          debug('Already active %s', alreadyActive);
          debug('Converted %s', count);

          var histogram = [0, 0, 0, 0, 0, 0];

          for (var i = 0; i < results.length; i++) {
            var f = results[i];

            var category = parseInt(f[3] / HOUR);

            debug(category);
            if (category < 6) {
              histogram[category] ++;
            }
          }
          res.json(histogram);
        });

    });
});


app.get('/getUserStats', function(req, res) {

  var User = server.yourExpoDb.collection('igusers');
  var Liker = server.yourExpoDb.collection('likers');
  var Photo = server.yourExpoDb.collection('photos');
  var Account = server.expoWatchDb.collection('accounts');

  var users = [];

  var getUsers = function(callback) {

    User
      .find({
        followed: true
      })
      .toArray(function(err, results) {
        if (err) return callback(err);

        for (var i = 0; i < results.length; i++) {
          var u = results[i];

          users.push({
            username: u.username,
            followedDate: u.followedTimestamp
          });
        }

        return callback();

      });
  };


  var getLikes = function(callback) {

    var usernames = _.map(users, function(u) {
      return u.username;
    });

    Liker
      .find({
        _id: {
          $in: usernames
        }
      })
      .toArray(function(err, results) {
        if (err) return callback(err);

        for (var i = 0; i < results.length; i++) {
          var liker = results[i];

          var user = _.find(users, function(u) {
            return u.username === liker._id;
          });

          var likes = _.filter(liker.likes, function(l) {
            return l > user.followedDate;
          });

          user.likes = likes[0];
        }

        return callback();
      });
  };


  var getPhotos = function(callback) {

    var usernames = _.map(users, function(u) {
      return u.username;
    });

    Photo
      .find({
        username: {
          $in: usernames
        }
      }, {
        username: 1,
        votes: 1
      })
      .toArray(function(err, results) {
        if (err) return callback(err);

        var authors = {};

        for (var i = 0; i < results.length; i++) {
          var photo = results[i];

          var username = photo.username;
          var postedDate = photo.votes[0].timestamp;

          if (!authors[username]) {
            authors[username] = [postedDate];
          } else {
            authors[username].push(postedDate);
          }
        }


        for (var k in authors) {

          var photos = authors[k];

          photos = _.sortBy(photos);

          var user = _.find(users, function(u) {
            return u.username === k;
          });

          photos = _.filter(photos, function(l) {
            return l > user.followedDate;
          });

          user.photos = photos[0];
        }

        return callback();


      });
  };

  var getFollowBack = function(callback) {

    var followersQuery = [{
      $match: {
        social: 'instagram',
        'raw.username': 'yourexpo2015',
        followersList: {
          $ne: null
        }
      }
    }, {
      $project: {
        "followersList.username": 1,
        "createdDate": 1
      }
    }, {
      $unwind: "$followersList"
    }, {
      $sort: {
        "createdTimestamp": 1
      }
    }, {
      $group: {
        _id: "$followersList.username",
        timestamp: {
          $first: "$createdDate"
        }
      }
    }];

    Account
      .aggregate(followersQuery, {
        allowDiskUse: true
      }, function(err, results) {
        if (err) return callback(err);

        for (var i = 0; i < users.length; i++) {
          var u = users[i];

          var follower = _.find(results, function(f) {
            return f._id === u.username;
          });

          if (follower) {
            u.followedBackDate = follower.timestamp;
          }
        }

        return callback();
      });
  };

  var actions = [getUsers, getFollowBack, getPhotos, getLikes];
  return async.series(actions, function(err)  {
    if (err) return res.json(err);

    return res.json(users);
  });
});


app.get('/ourPostsStat', function(req, res) {

  var query = [{
    $match: {
      social: 'instagram',
      "raw.username": "yourexpo2015"
    }
  }, {
    $project: {
      "media.created_time": 1,
      "media.likes.count": 1,
      "media.id": 1,
      "media.comments.count": 1,
      createdDate: 1
    }
  }, {
    $unwind: "$media"
  }, {
    $group: {
      _id: '$media.id',
      createdDate: {
        $first: '$media.created_time'
      },
      stats: {
        $push: {
          likes: "$media.likes.count",
          comments: "$media.comments.count",
          createdDate: "$createdDate"
        }
      }
    }
  }];

  var Account = server.expoWatchDb.collection('accounts');

  var categories = require('./postCategory.json');
  Account
    .aggregate(query, {
      allowDiskUse: true
    }, function(err, results) {
      if (err) return res.json(err);

      //return res.json(results);
      var data = {};

      var posts = [];
      for (var i = 0; i < results.length; i++) {
        var photo = results[i];

        var snapshots = photo.stats;
        var createdTime = new Date(photo.createdDate * 1000);

        var totalLikes = snapshots[snapshots.length - 1].likes;
        var totalComments = snapshots[snapshots.length - 1].comments;

        var earlyLikes = snapshots[0].likes;
        var earlyComments = snapshots[0].comments;


        for (var j = 0; j < snapshots.length; j++) {
          var s = snapshots[j];

          var time = (s.createdDate - createdTime) / (1000 * 60 * 60);
          if (time < 12) {
            earlyLikes = s.likes;
            earlyComments = s.comments;
          }
        }

        var category = categories[photo._id];

        if (!data[category]) {
          data[category] = {};

          data[category].totalComments = 0;
          data[category].totalLikes = 0;
          data[category].earlyLikes = 0;
          data[category].earlyComments = 0;
        }

        data[category].earlyComments += earlyComments;
        data[category].totalLikes += totalLikes;
        data[category].earlyLikes += earlyLikes;
        data[category].totalComments += totalComments;

        posts.push({
          id: photo._id,
          category: category,
          earlyLikes: earlyLikes,
          earlyComments: earlyComments,
          totalComments: totalComments,
          totalLikes: totalLikes
        });

      }

      return res.json(posts);

      var cats = ["annuncio", "recall", "finalisti", "vincitori", "other", "composite"];

      var stats = [];
      for (var i = 0; i < cats.length; i++) {
        var c = cats[i];

        var count = _.filter(categories, function(v) {

          return v === c;
        }).length;

        data[c].earlyComments /= count;
        data[c].totalLikes /= count;
        data[c].earlyLikes /= count;
        data[c].totalComments /= count;
        data[c].category = c;
        stats.push(data[c]);
      }
      res.json(stats);
    });
});


app.get('/getComments', function(req, res) {

  var Comment = server.yourExpoDb.collection('comments');
  var Photo = server.yourExpoDb.collection('photos');

  var comments = [];
  var tags = [
    "EXPO2015artfun",
    "EXPO2015cibovita",
    "EXPO2015dolceamaro",
    "EXPO2015fastslow",
    "EXPO2015gustomondo",
    "EXPO2015italianlife",
    "EXPO2015nightday",
    "EXPO2015oggidomani",
    "EXPO2015showcooking",
    "EXPO2015stuporesapore",
    "EXPO2015terramare"
  ];

  var getChallengeComments = function(tag, callback) {

    Photo
      .find({
        tag: tag
      }, {
        providerId: 1,
      })
      .toArray(function(err, results) {
        if (err) return callback(err);

        var photoIds = _.map(results, function(p) {
          return p.providerId;
        });

        Comment
          .find({
            postId: {
              $in: photoIds
            },
            timestamp: {
              $gt: new Date(challengeMap[tag][0]),
              $lt: new Date(challengeMap[tag][1])
            }
          }, {
            timestamp: 1,
            text: 1,
            username: 1
          })
          .toArray(function(err, results) {
            if (err) return callback(err);

            comments.push({
              tag: tag,
              comments: results.length
            });

            debug('Challenge %s got %s comments', tag, results.length);

            return fs.writeFile(tag + 'comments.json', JSON.stringify(results, null, 2), callback);
          });

      });
  };

  async.each(tags, getChallengeComments, function(err) {
    if (err) return res.json(err);

    return res.json(comments);
  });
});


app.get('/getFacebookStats', function(req, res) {

  var facebookMap = require('./facebookObjectMap.json');

  var Facebook = server.facebookDb.collection('facebookobjects');

  var data = [];
  var ids = [776386282436917, 778158892259656, 780063332069212, 780063775402501];

  var getStats = function(object, callback) {

    debug(object);
    Facebook
      .find({
        facebookId: object
      }, {
        facebookId: 1,
        likes: 1
      })
      .toArray(function(err, results) {
        if (err) return callback(err);

        debug('Found %s snapshots', results.length);

        var name = _.find(facebookMap, function(n) {
          return n.id === object;
        });
        for (var i = 0; i < results.length; i++) {
          var r = results[i];

          r.name = name;
          data.push(r);
        }
        return callback();

      });
  };

  async.each(ids, getStats, function(err) {
    if (err) return res.json(err);

    fs.writeFileSync('facebookStats.json', JSON.stringify(data, null, 2));
    res.json({});
  });

});


app.get('/mergeEvents', function(req, res) {

  var events = require('./instagramEvents.json');
  var categories = require('./postCategory.json');

  var classifiedEvents = [];
  for (var i = 0; i < events.length; i++) {
    var e = events[i];

    var category = categories[e.id];

    classifiedEvents.push({
      id: e.id,
      date: new Date(e.timestamp * 1000),
      category: category
    });
  }

  fs.writeFileSync('classifiedEvents.json', JSON.stringify(classifiedEvents, null, 2));
  res.json({});
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
  var facebookCon = mongoose.createConnection("mongodb://localhost/facebooWatch");
  server.expoWatchDb = expoWatchConn;
  server.yourExpoDb = yourExpoConn;
  server.facebookDb = facebookCon;

  Account = server.expoWatchDb.collection('accounts');

  console.log('Server up on port 3210');


});