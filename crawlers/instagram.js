var debug = require('debug')('instagram');
var ig = require('instagram-node').instagram();
var mongoose = require('mongoose');
var Promise = require('bluebird');

debug('Configuring the Instagram crawler');

var configuration = require('../configuration/configuration.json');

ig.use({
  client_id: configuration.instagram.consumer,
  client_secret: configuration.instagram.secret
});

Promise.promisifyAll(ig);
Promise.promisifyAll(mongoose);

debug('Instagram crawler configured');

var saveData = function(data) {
  debug('Saving the data');
  var rawAccount = {
    raw: data[0],
    social: 'instagram',
    post: data[0].counts.media,
    follower: data[0].counts.followed_by,
    likes: data[0].counts.followed_by,
    following: data[0].counts.follows,
    media: data[0].media
  };

  delete rawAccount.raw.media;
  var Account = mongoose.model('account');

  return (new Account(rawAccount)).saveAsync();
};


var getPhotos = function(data) {

  var media = [];
  var handleRequest = function(images, pagination) {
    debug('getting the photo');
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
    });
};

var getAccountStat = function(data) {
  debug('Getting the stat for the %s account', data.name);
  return ig.userAsync(data.id)
    .then(getPhotos)
    .then(saveData)
    .catch(function(err) {
      debug('An error occurred');
      debug(err);
    });
};

var crawler = {
  getAccountStat: getAccountStat
};

module.exports = exports = crawler;