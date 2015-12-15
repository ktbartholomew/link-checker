var blc = require("broken-link-checker");
var argv = require('yargs').argv;
var chalk = require('chalk');
var util = require('util');

var links = {
  checked: []
};

var counts = {
  total: 0,
  broken: 0,
  ok: 0
};

var checker = new blc.SiteChecker({
  requestMethod: 'get',
  cacheResponses: true
}, {
    link: function (result) {
      var url = result.url.resolved;
      if (links.checked.indexOf(url) != -1) {
        return;
      }

      links.checked.push(url);
      counts.total++;

      if(result.broken) {
        counts.broken++;
        var errorMessage;

        if(result.error) {
          errorMessage = result.error.message;
        }
        else {
          errorMessage = result.http.statusCode;
        }

        return process.stderr.write(chalk.red(util.format('%s Link to %s found on page %s. Error: %s\n', statusColumn('broken'), url, result.base.resolved, errorMessage)));
      }

      process.stdout.write(chalk.green(util.format('%s %s\n', statusColumn('ok'), url)));
      counts.ok++;
    },
    end: function () {
      process.stdout.write(util.format('[%s/%s] broken links found\n', counts.broken, counts.total));

      if(counts.broken > 0) {
        return process.exit(1);
      }

      else {
        return process.exit(0);
      }
    }
});

var statusColumn = function (status) {
  var statusString;

  switch(status.toLowerCase()) {
    case 'broken':
      statusString = chalk.red('[ BROKEN ]');
    break;
    case 'ok':
      statusString = chalk.green('[   OK   ]');
    break;
    default:
      statusString = chalk.green('[   OK   ]');
    break;
  }

  return statusString;
};


var urlToCheck = process.env.CHECK_URL || argv.u || argv.url;

if (!urlToCheck) {
  process.stderr.write(chalk.red('None of CHECK_URL, -u, or --url provided. Nothing to do.\n'));
  process.exit(1);
}

checker.enqueue(urlToCheck);
