# cdnup

CDNup is a simple wrapper around `pkgcloud` which allows for a simple uploading
interface as well as the ability to define a CDN URL that fronts whereever you
are uploading your assets to.

## Installation

```sh
npm install --save cdnup
```

## Usage

In all examples we assume that you've already required and initialized the
module as followed:

```js
'use strict';

var CDNUp = require('cdnup');

var cdnup = new CDNUp('bucket-name', {
  //
  // It is still assumed that the `bucket-name` prefix is appended to the
  // following url
  //
  url: 'https://myCdnEndpoint.com',
  pkgcloud: { /* Pkgcloud config options */ }
});
```

As you can see in the example above we allow 2 arguments in the constructor:

1. `root`: The relative path to the files on the CDN server.
2. `options`: Optional configuration object. The following keys are supported:
  - `sharding`: Randomly select one of the supplied `urls` of the CDN so assets
    can be sharded between different DNS/subdomains.
  - `url/urls`: A url string or urls array for what you will use to publicly
    fetch assets from the CDN.

#### Authorization

We use [`pkgcloud`][pkgcloud] in order to upload CDN assets. It supports most if
not all cloud providers depending on what you use and who you want to trust with
your assets. Check out the documentation and our sample config to see how you
may set this up for you.

```js
var cdnup = new CDNUp('ux/core', {
  pkgcloud: {
    provider: 'amazon',
    //...
  }
});
```

## API

The following API methods are available.

#### upload

This is the method that you will be using the most, `upload`. When you first
call the method it might take a second to work because it will first create the
bucket if that has not already been done

Once initialized, it will write the files to the cloud provider and call your supplied
callback. It requires 3 arguments:

- A buffer, stream or path to the file that needs to be stored.
- Filename of the thing that we're about to store. It will be `path.join`'ed
  with the `root` argument of the constructor.
- Completion callback that follows the error first callback pattern.

```js
cdnup.upload('/path/to/file.js', 'file.js', function (err) {
  if (err) return console.error('Shits on fire yo.');

  console.log('all good');
});
```

#### init

Initialize the cloud provider with the given `bucket-name` passed to the
constructor.

```js
cdnup.init(function (err) {
  if (err) console.error('failed to mount cdn');
});
```

## License

MIT

[pkgcloud]: https://github.com/pkgcloud/pkgcloud
