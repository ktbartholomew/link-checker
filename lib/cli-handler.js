var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var program = require('commander');
var Queue = require('./queue');

module.exports = function (url) {
  var Watcher = new EventEmitter();

  Watcher.on('done', function (links) {
    var total = links.length;
    var broken = _.filter(links, function (link) {
      return link.broken;
    }).length;

    console.log('Crawl complete! Broken: %s Broken/Total: %s', broken, broken/total);
    if(program.threshold < 1) {
      process.exit((broken/total < program.threshold) ? 0 : 1);
    }
    else {
      process.exit((broken < program.threshold) ? 0 : 1);
    }
  });

  Watcher.on('response', function (link) {
    if(link.broken) {
      console.log('[ BROKEN ] URL:      %s', link.url);
      console.log('           Error:    %s', link.error);
      console.log('           Referrer: %s', link.referrer);
      console.log('           Element:  %s', link.html);
    }
    else if(program.verbose) {
      console.log('[   OK   ] URL:      %s', link.url);
    }
  });

  Queue.emit('init', {
    watcher: Watcher,
    baseUrl: url,
    concurrency: program.concurrency
  });

  Queue.add({
    url: url
  });
};
