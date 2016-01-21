var EventEmitter = require('events').EventEmitter;
var url = require('url');

var _ = require('lodash');
var superagent = require('superagent');
var jsdom = require('jsdom');

var Queue = new EventEmitter();

// We have a nasty circular dependency with Fetcher, so export this before
// requiring that module
module.exports = Queue;

var Link = require('./link');
var Fetcher = require('./fetcher');

/**
 * Get the number of requests that are currently pending (request sent, but
 * response not received).
 *
 * @return Number
 */
Queue.pendingRequests = function () {
  return _.filter(this.links, function (item) {
    return item.pending;
  }).length;
};

/**
 * Initiates requests for links that are waiting in the queue, until the max
 * number of concurrent requests are open.
 */
Queue.fillFetchQueue = function () {
  while(this.pendingRequests() <= this.maxConcurrency) {
    var firstWaitingLink = _.find(this.links, function (item) {
      return item.pending === false && item.complete === false;
    });

    if(!firstWaitingLink) {
      break;
    }

    Fetcher.fetch(firstWaitingLink, this.parseCallback.bind(this));
  }
};

/**
 * Called after Fetcher parses the DOM of a visited link. Determines whether
 * any other links are waiting to be assessed, and emits the `done` event if
 * none are found
 */
Queue.parseCallback = function () {
  var linksLeft = _.filter(this.links, function (item) {
    return item.complete === false;
  }).length;

  if(linksLeft === 0) {
    this.emit('done');
  }
};

/**
 * Basically a constructor for Queue. There's a better way to do this.
 */
Queue.once('init', function (options) {
  this.Watcher = options.watcher || new EventEmitter();
  this.baseUrl = options.baseUrl || '';
  this.maxConcurrency = options.concurrency || 5;
  this.links = [];
});

/**
 * Triggered when a new link is found. Adds it to the queue and attempts to
 * start processing by calling Queue.fillFetchQueue
 */
Queue.on('add', function (link) {
  if(_.find(this.links, function (item) {
    return item.url === link.url;
  })) {
    return;
  }

  var newLink = Object.create(Link, {
    url: {
      value: link.url,
      enumerable: true,
      writable: false
    },
    html: {
      value: link.html,
      enumerable: true,
      writable: false
    },
    referrer: {
      value: link.referrer,
      enumerable: true,
      writable: false
    }
  });

  this.links.push(newLink);
  this.fillFetchQueue();
});

Queue.on('response', function (link) {
  this.fillFetchQueue();

  this.Watcher.emit('response', link);
});

Queue.once('done', function () {
  // defer to next tick, because it's likely the very last response event hasn't
  // triggered its output yet.
  process.nextTick(function () {
    this.Watcher.emit('done', this.links);
  }.bind(this));
});

Queue.add = function (link) {
  this.emit('add', {
    url: link.url,
    html: link.html,
    referrer: link.referrer
  });
};
