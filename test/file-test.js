'use strict';

describe('File', function () {
  var File = require('../file');
  var assume = require('assume');

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
