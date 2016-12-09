# Link Checker

Crawls a page/site and reports broken links or images.

## Installation

```
npm install -g recursive-link-checker
```

or, just pull the Docker image:

```
docker pull ktbartholomew/link-checker
```

**Don't forget:** the name of the install package and the name of the binary are different. You're installing `recursive-link-checker` but will actually use the application as just `link-checker`.

## Usage

The global npm binary way:

```
$ link-checker [options] <url>
```

The Docker way:

```
$ docker run --rm ktbartholomew/link-checker [options] <url>
```

Either way, when you run it, it looks something like this:

```
$ bin/link-checker http://localhost:8080/
[  BROKEN  ] URL:      http://localhost:8080/broken-link/
             Error:    Error: Not Found
             Referrer: https://localhost:8080/about/
             Element:  <a href="/broken-link/">Broken Link</a>
[ INSECURE ] URL:      http://anotherhost/external.js
             Error:    Insecure resources cannot be loaded from secured URLs
             Referrer: https://localhost:8080/about/
             Element:  <script src="http://anotherhost/external.js"></script>

Crawl complete!
1/22 links were broken (4.54%)
1/22 insecure resources loaded from secure URLs (4.54%)
```

### Options

```
-h, --help               output usage information
-c, --concurrency <num>  How many links to check concurrently. Default: 5
-t, --threshold <num>    Exit with error if this many broken links are found. Percentage of broken/total if < 1, count of total broken links if >= 1
-B, --no-broken          Don’t check for broken links
-A, --no-assets          Don’t check linked assets like JavaScript and CSS
-I, --no-images          Don’t check images
-L, --no-links           Don’t check hyperlinks
-S, --no-insecure        Don’t check for insecure resource loading
-m, --minimal            Print minimal messages only showing the type of error, url, and referrer
-v, --verbose            Be more verbose
```

### Exit codes

An exit code of 0 is a success and an exit code of 1 is a failure. The exit code can be manipulated by providing a value to `--threshold`.

To fail if 5% or more of all crawled links are broken (this is the default failure threshold):

```
$ link-checker --threshold 0.05 <url>
```

To fail if 5 or more links are broken:

```
$ link-checker --threshold 5 <url>
```
