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
    following: data[0].counts.follows
  };

  var Account = mongoose.model('account');

  return (new Account(rawAccount)).saveAsync();
};

var getAccountStat = function(data) {
  debug('Getting the stat for the %s account', data.name);
  return ig.userAsync(data.id)
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