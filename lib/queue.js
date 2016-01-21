var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var superagent = require('superagent');
var jsdom = require('jsdom');

var Link = require('./link');

var links = [];
var baseUrl = '';
var Watcher = new EventEmitter();
var Queue = new EventEmitter();

var fetch = function (link) {
  link.pending = true;

  superagent.get(link.url)
  .end(function (err, res) {
    Queue.emit('response', link, err, res);
  });
};

var parseResponse = function (link, response, callback) {
  if(!link.url.match('^' + baseUrl)) {
    return callback();
  }

  jsdom.env(response.text, [], {url: link.url}, function (err, window) {
    var links = window.document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(links, function (element) {
      if(element.href.indexOf('#') !== -1) {
        element.href = element.href.substr(0, element.href.indexOf('#'));
      }

      Queue.add(element.href, link.url);
    });

    callback();
  });
};

Queue.on('init', function (options) {
  Watcher = options.watcher;
  baseUrl = options.baseUrl;
});

Queue.on('add', function (url, referrer) {
  var matchingLink = _.find(links, function (item) {
    return item.url === url;
  });

  if(matchingLink) {
    return;
  }

  var link = Object.create(Link, {
    url: {
      value: url,
      enumerable: true,
      writable: false
    },
    referrer: {
      value: referrer,
      enumerable: true,
      writable: false
    }
  });

  links.push(link);
  fetch(link);
});

Queue.on('response', function (link, error, response) {
  link.complete = true;

  if(error) {
    link.broken = true;
    link.error = error;
  }
  else {
    link.ok = true;
  }

  Watcher.emit('response', link);

  process.nextTick(function () {
    parseResponse(link, response, function () {
      var linksLeft = _.filter(links, function (item) {
        return item.pending === true || item.completed === false;
      }).length;

      if(linksLeft === 0) {
        Queue.emit('done');
      }
    });
  });
});

Queue.on('done', function () {
  Watcher.emit('done', links);
});

Queue.add = function (url, referrer) {
  this.emit('add', url, referrer);
};

module.exports = Queue;
