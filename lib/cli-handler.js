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

    console.log('Crawl complete! %s/%s links were broken (%s%)', broken, total, (broken/total*100).toFixed(1));
  });

  Watcher.on('response', function (link) {
    process.nextTick(function () {
      if(link.broken) {
        console.log('[ BROKEN ] %s - %s - Referred by %s', link.url, link.error, link.referrer);
      }
      else if(program.verbose) {
        console.log('[   OK   ] %s', link.url);
      }
    });
  });

  Queue.emit('init', {watcher: Watcher, baseUrl: url});
  Queue.add(url);
};
