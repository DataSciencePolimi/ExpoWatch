var path = require('path');
var debug = require('debug')('crawler');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Promise = require('bluebird');

var configuration = require('./configuration/configuration.json');

var crawlers = {};
var db;
var Account;

var loadCrawlers = function() {
  debug('Loading the crawlers');
  var crawlerList = fs.readdirSync('crawlers');

  _.each(crawlerList, function(crawlerName) {

    debug('Loading crawler from file: %s', crawlerName);
    var crawlerFile = path.join(__dirname, 'crawlers', crawlerName);
    debug('Crawler File: %s', crawlerFile);
    crawlers[crawlerName.replace('.js', '')] = require(crawlerFile);
  });
};

var callCrawler = function(account) {
  return crawlers[account.social].getAccountStat(account);
};

var confingMongo = function() {
  debug('Configuring the database');
  mongoose.connect(configuration.db);
  db = mongoose.connection;
  Account = require('./model/account.js');
};


loadCrawlers();
confingMongo();

var accounts = configuration.accounts;

function crawl() {
  var promises = [];

  _.each(accounts, function(account) {
    promises.push(callCrawler(account));
  });

  return Promise
    .all(promises)
    .then(function() {
      debug('Iteration done');
    })
    .delay(3000)
    .then(crawl);
}

crawl();