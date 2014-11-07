var debug = require('debug')('facebook');
var FB = require('fbgraph');
var mongoose = require('mongoose');
var Promise = require('bluebird');

debug('Configuring the Facebook crawler');

var configuration = require('../configuration/configuration.json');
FB.setAccessToken(configuration.facebook.token);

Promise.promisifyAll(FB);
Promise.promisifyAll(mongoose);

debug('Facebook crawler configured');

var saveData = function(data) {
  debug('Saving the data');

  var rawAccount = {
    raw: data,
    social: 'facebook',
    follower: data.likes,
    likes: data.likes
  };

  var Account = mongoose.model('account');

  return (new Account(rawAccount)).saveAsync();
};

var getAccountStat = function(data, callback) {
  debug('Getting the stat for the %s account', data.name);

  return FB.getAsync('/' + data.id)
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