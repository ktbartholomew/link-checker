var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var program = require('commander');
var Queue = require('./queue');

module.exports = function (url) {
  var Watcher = new EventEmitter();

  Watcher.on('done', function (links) {
    var total = _.sumBy(links, function (link) {
      return link.references;
    });

    var broken = _.sumBy(links, function (link) {
      if(link.broken) {
        return link.references;
      }

      return 0;
    });

    var insecure = _.sumBy(links, function(link) {
      return link.insecureReferences;
    });

    console.log('Crawl complete!');
    console.log('Broken: %s Broken/Total: %s', broken, (broken/total).toFixed(5));
    console.log('Insecure: %s Insecure/Total: %s', insecure, (insecure/total).toFixed(5));

    if(program.threshold < 1) {
      process.exit(((broken/total + insecure/total) < program.threshold) ? 0 : 1);
    }
    else {
      process.exit(((broken + insecure) < program.threshold) ? 0 : 1);
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
