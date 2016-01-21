# Link Checker

Crawls a page/site and reports broken links or images.

## Installation

```
npm install -g link-checker
```

or, just pull the Docker image:

```
docker pull ktbartholomew/link-checker
```

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
[ BROKEN ] URL:      http://localhost:8080/broken-link/
           Error:    Error: Not Found
           Referrer: http://localhost:8080/about/
           Element:  <a href="/broken-link/">Broken Link</a>
Crawl complete! 1/22 links were broken (4.5% broken)
```

### options

```
-h, --help               output usage information
-c, --concurrency <num>  How many links to check concurrently. Default: 5
-A, --no-assets          Don’t check linked assets like JavaScript and CSS
-I, --no-images          Don’t check images
-L, --no-links           Don’t check hyperlinks
-v, --verbose            Be more verbose
```
