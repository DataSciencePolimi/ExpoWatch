var debug = require('debug')('pinterest');

var getAccountStat = function(data, callback) {
  debug('I\'m pinterest');
  return callback();
};

var crawler = {
  getAccountStat: getAccountStat
};

module.exports = exports = crawler;