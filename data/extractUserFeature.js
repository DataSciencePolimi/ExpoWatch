var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('underscore');
var debug = require('debug')('user feature');
var fs = require('fs');

Promise.promisifyAll(mongoose);

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
};

var conf = require('./configuration/configuration.json');

mongoose.connect(conf.dbYourExpo);
var yourExpoConn = mongoose.connection;

var UserFeatureSchema = new mongoose.Schema({
  username: String,
  commentsCount: Number,
  likesCount: Number,
  photosCount: Number,
  commentsRate: Number,
  likesRate: Number,
  photosRate: Number

});

debug('Loading the schema');
var UserFeature = mongoose.model('userfeature', UserFeatureSchema);

var getLikeCount = function() {


  debug('Getting the like count');
  var query = [{
      $match: {
        $and: [{
          "timestamp": {
            $lt: new Date("2015-02-14 23:59:59.000Z")
          }
        }, {
          "timestamp": {
            $gt: new Date("2014-12-13 00:00:00.000Z")
          }
        }]
      }
    }, {
      $group: {
        _id: '$username',
        likesCount: {
          $sum: 1
        }
      }
    }, {
      $project: {
        "username": "$_id",
        "likesCount": 1,
        _id: 0
      }
    }

  ];


  return yourExpoConn
    .collection('usernames')
    .aggregateAsync(query)
    .then(function(data) {
      debug(data.length);

      //return yourExpoConn.collection('userfeature').insertAsync(data[0]);
      //return Promise.resolve();

      var promises = _.map(data, function(user) {

        //debug('User %s', user.username);

        var User = yourExpoConn.collection('userfeature');

        var query = {
          username: user.username
        };

        var update = {
          $set: {
            likesCount: user.likesCount,
            username: user.username
          }
        };

        Promise.promisifyAll(User);
        return User.findAndModifyAsync(query, {
            _id: 1
          }, update, {
            upsert: true
          })
          .then(function() {
            debug('Updated user %s', user.username);
          })
          .catch(function(err) {
            debug('Error in getting like for user %s', user.username);
            debug(err);
          });
      });

      return Promise
        .settle(promises)
        .then(function() {
          debug('asd');
        })
        .catch(function(err) {
          debug(err);
        });
    });

};

var getCommentCount = function(data) {
  debug('Getting the comments count');

  var query = [{
    $project: {
      "timestamp": 1,
      id: 1,
      username: 1
    }
  }, {
    $match: {
      $and: [{
        "timestamp": {
          $lt: new Date("2015-02-14 23:59:59.000Z")
        }
      }, {
        "timestamp": {
          $gt: new Date("2014-12-13 00:00:00.000Z")
        }
      }]
    }
  }, {
    $group: {
      _id: "$username",
      commentsCount: {
        $sum: 1
      }
    }
  }, {
    $project: {
      "username": "$_id",
      "_id": 0,
      "commentsCount": 1
    }
  }];

  return yourExpoConn
    .collection('comments')
    .aggregateAsync(query)
    .then(function(data) {
      debug(data.length);

      var promises = _.map(data, function(user) {

        //debug('User %s', user.username);

        var User = yourExpoConn.collection('userfeature');

        var query = {
          username: user.username
        };

        var update = {
          $set: {
            commentsCount: user.commentsCount,
            username: user.username
          }
        };

        Promise.promisifyAll(User);
        return User.findAndModifyAsync(query, {
            _id: 1
          }, update, {
            upsert: true
          })
          .then(function() {
            debug('Updated user %s', user.username);
          })
          .catch(function(err) {
            debug('Error in getting comment for user %s', user.username);
            debug(err);
          });
      });

      return Promise
        .settle(promises)
        .then(function() {
          debug('finished updateing comments');
        })
        .catch(function(err) {
          debug(err);
        });
    });
};

var getPhotoCount = function(data) {
  debug('Getting the photos count');

  var query = [{
    $project: {
      "creationDate": 1,
      id: 1,
      username: 1
    }
  }, {
    $group: {
      _id: "$username",
      photosCount: {
        $sum: 1
      }
    }
  }, {
    $project: {
      "username": "$_id",
      "_id": 0,
      "photosCount": 1
    }
  }];

  return yourExpoConn
    .collection('photos')
    .aggregateAsync(query)
    .then(function(data) {
      debug(data.length);

      var promises = _.map(data, function(user) {

        //debug('User %s', user.username);

        var User = yourExpoConn.collection('userfeature');

        var query = {
          username: user.username
        };

        var update = {
          $set: {
            photosCount: user.photosCount,
            username: user.username
          }
        };

        Promise.promisifyAll(User);
        return User.findAndModifyAsync(query, {
            _id: 1
          }, update, {
            upsert: true
          })
          .then(function() {
            debug('Updated user %s', user.username);
          })
          .catch(function(err) {
            debug('Error in getting photos for user %s', user.username);
            debug(err);
          });
      });

      return Promise
        .settle(promises)
        .then(function() {
          debug('finished updating photos');
        })
        .catch(function(err) {
          debug(err);
        });
    });
};

var likers = function() {

  var MAX = 685;

  var promises = [];

  //var User = yourExpoConn.collection('userfeature');
  //Promise.promisifyAll(User);
  for (var i = 1; i <= 685; i++) {

    var likes = i;


    debug('Creating promise %s', i);
    var p = UserFeature
      .findAsync({
        likesCount: likes,
        photosCount: 0,
        commentsCount: 0
      })
      .then(function(data) {
        //debug('%s', data.length);
        return Promise.resolve(data.length);
      })
      .catch(function(err) {
        debug(err);
      });

    promises.push(p);
  }

  return Promise
    .settle(promises)
    .then(function(data) {
      debug('Writing the csv');
      var fields = 'likes,users\n';

      var file = fields;
      for (var i = 0; i < data.length; i++) {
        var promisedData = data[i];

        if (promisedData.isFulfilled()) {
          debug('%s made %s likes', i, promisedData.value());

          file += i + ',' + promisedData.value() + '\n';
        }
      }

      fs.writeFileSync('onlyLikers.csv', file);
      debug('finished');
    })
    .catch(function(error) {
      debug(error);
    });

};

likers();