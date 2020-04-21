'use strict';


describe('File', function () {
  const Client = require('./mock-client');
  const sinon = require('sinon');
  const path = require('path');

  var File = require('../file');
  var assume = require('assume');

  assume.use(require('assume-sinon'));

  describe('uploadOpts', function () {
    it('it spreads uploadOpts as parameters to pkgcloud upload', function (next) {
      var file = new File(1, {
        client: new Client(),
        acl: 'public-read',
        bucket: 'what'
      }, {
        uploadOpts: {
          cacheControl: 'max-age=10'
        }
      });
      const spy = sinon.spy(file.client, 'upload');

      file.create(path.join(__dirname, '/fixture.js'), 'other.js', (err) => {
        assume(err).is.falsey();
        assume(spy).is.called(1);
        assume(spy.getCall(0).args[0].cacheControl).equals('max-age=10');
        next();
      });

    });
  });

  describe('#contentType', function () {
    it('looks up the content type', function () {
      var file = new File(5, {}, {});

      assume(file.contentDetect('hello.js').type).equals('application/javascript');
      assume(file.contentDetect('hello.html').type).equals('text/html');
      assume(file.contentDetect('hello.dfadfasdf').type).equals('application/octet-stream');
      assume(file.contentDetect('hello.js.gz')).eql({ type: 'application/javascript', enc: 'gzip' });
    });

    it('allows prefers override over `mime` library', function () {
      var file = new File(5, {}, {
        mime: {
          '.svgs': 'text/plain',
          '.html': 'fake/news'
        }
      });

      assume(file.contentDetect('hello.html').type).equals('fake/news');
      assume(file.contentDetect('hello.svgs').type).equals('text/plain');
    });
  });
});


