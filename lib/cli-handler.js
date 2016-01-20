var program = require('commander');
var superagent = require('superagent');
var jsdom = require('jsdom');
var Q = require('q');

var queue = require('./queue');
var stats = require('./stats');
var queueWorker = require('./queue-worker');

var baseUrl = '';

module.exports = function (url) {
  stats.baseUrl = url;
  queue.links.push(url);

  queueWorker.start()
  .then(function () {
    console.log(stats.getStats());
    process.exit(0);
  });
};
