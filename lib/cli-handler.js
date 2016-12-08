var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var program = require('commander');
var Queue = require('./queue');

module.exports = function (url) {
  var logResult = function (code, link) {
    if (program.minimal || link.ok) {
      console.log('[%s] %s %s', code.trim(), link.url, link.ok ? '' : link.referrer);
    } else {
      var whitespace = '';

      for (var i = 0; i < code.length; i++) {
        whitespace += ' ';
      }

      console.log('[ %s ] URL:      %s', code, link.url);
      console.log('  %s   Error:    %s', whitespace, link.error);
      console.log('  %s   Referrer: %s', whitespace, link.referrer);
      console.log('  %s   Element:  %s', whitespace, link.html);
    }
  };

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
      return link.insecureResourceReferences;
    });

    console.log('\nCrawl complete!');

    if (program.broken) {
      console.log('Broken   : %s; Percent of total: %s%', broken, (broken / total * 100).toFixed(2));
    }

    if (program.insecure) {
      console.log('Insecure : %s; Percent of total: %s%', insecure, (insecure / total * 100).toFixed(2));
    }

    var invalid_total;

    if(program.threshold < 1) {
      invalid_total = (program.broken ? broken/total : 0) + (program.insecure ? insecure/total : 0);
      process.exit((invalid_total < program.threshold) ? 0 : 1);
    }
    else {
      invalid_total = (program.broken ? broken : 0) + (program.insecure ? insecure : 0);
      process.exit((invalid_total < program.threshold) ? 0 : 1);
    }
  });

  Watcher.on('insecure-reference', function (link) {
    if (program.insecure) {
      logResult('INSECURE', link);
    }
  });

  Watcher.on('response', function (link) {
    if(link.broken && program.broken) {
      logResult(' BROKEN ', link);
    }
    else if(program.verbose) {
      logResult('   OK   ', link);
    }
  });

  Queue.emit('init', {
    watcher: Watcher,
    baseUrl: url,
    concurrency: program.concurrency
  });

  Queue.add({
    url: url,
    referrer: url // Cheap way to avoid checks on the referrer later
  });
};
