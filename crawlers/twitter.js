var debug = require('debug')('twitter');
var Twitter = require('twit');
var Promise = require('bluebird');
var mongoose = require('mongoose');

debug('Configuring the twitter crawler');

var configuration = require('../configuration/configuration.json');

var T = new Twitter({
  consumer_key: configuration.twitter.consumer,
  consumer_secret: configuration.twitter.secret,
  access_token: configuration.twitter.token,
  access_token_secret: configuration.twitter.tokenSecret
});

Promise.promisifyAll(T);
Promise.promisifyAll(mongoose);

debug('twitter crawler configured');


var saveData = function(data) {

  debug('Saving the data');
  var rawAccount = {
    raw: data[0],
    social: 'twitter',
    post: data[0].statuses_count,
    follower: data[0].followers_count,
    likes: data[0].followers_count,
    following: data[0].friends_count
  };

  var Account = mongoose.model('account');

  return (new Account(rawAccount)).saveAsync();
};

var getAccountStat = function(data) {
  debug('Getting the stat for the %s account', data.name);

  return T.getAsync('/users/show', {
      screen_name: data.name
    })
    .then(saveData)
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