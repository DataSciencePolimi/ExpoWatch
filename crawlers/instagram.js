var debug = require('debug')('instagram');
var ig = require('instagram-node').instagram();
var mongoose = require('mongoose');
var Promise = require('bluebird');
var _ = require('underscore');

debug('Configuring the Instagram crawler');

var configuration = require('../configuration/configuration.json');

ig.use({
  client_id: configuration.instagram.consumer,
  client_secret: configuration.instagram.secret
});

Promise.promisifyAll(ig);
Promise.promisifyAll(mongoose);

debug('Instagram crawler configured');

var saveData = function(account, data) {
  debug('Saving the data');
  var rawAccount = {
    raw: data[0],
    social: 'instagram',
    post: data[0].counts.media,
    follower: data[0].counts.followed_by,
    likes: data[0].counts.followed_by,
    following: data[0].counts.follows,
    media: data[0].media,
    followersList: data[0].followersList
  };

  delete rawAccount.raw.media;
  delete rawAccount.raw.followersList;

  var Account = mongoose.model('account');

  return (new Account(rawAccount)).saveAsync();
};


var getFollowers = function(account, data) {

  if (!account.followers) {
    debug("don't have to retrieve follower list");
    return Promise.resolve(data);
  }

  var followersList = [];

  var handleRequest = function(followers, pagination) {
    debug('getting the followers for the account %s', account.name);

    return Promise.resolve()
      .then(function() {
        followersList = followersList.concat(followers);
        if (pagination.next) {
          debug('new page');
          var nextPage = Promise.promisify(pagination.next);
          return nextPage().spread(handleRequest);
        } else {
          debug('all the followers downloaded');
          data[0].followersList = followersList;
          return data;
        }
      });
  };

  return ig.user_followersAsync(data[0].id)
    .spread(handleRequest)
    .catch(function(err) {
      debug('an error occurred');
      debug('err');
      throw err;
    });
};

var getPhotos = function(account, data) {

  var media = [];
  var handleRequest = function(images, pagination) {
    debug('getting the photo %s', account.name);
    return Promise.resolve()
      .then(function() {
        media = media.concat(images);
        if (pagination.next) {
          debug('new page');
          var nextPage = Promise.promisify(pagination.next);
          return nextPage().spread(handleRequest);
        } else {
          debug('images downloaded');
          data[0].media = media;
          return data;
        }

      });
  };


  return ig.user_media_recentAsync(data[0].id)
    .spread(handleRequest)
    .catch(function(err) {
      debug('An error occurred');
      debug(err);
      throw err;
    });
};

var getAccountStat = function(account) {
  debug('Getting the stat for the %s account', account.name);
  return ig.userAsync(account.id)
    .then(_.partial(getFollowers, account))
    .then(_.partial(getPhotos, account))
    .then(_.partial(saveData, account))
    .catch(function(err) {
      debug('An error occurred');
      debug(err);
      throw err;
    });
};

var crawler = {
  getAccountStat: getAccountStat
};

module.exports = exports = crawler;