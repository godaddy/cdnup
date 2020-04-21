const { PassThrough } = require('stream');

class Client {
  _write() {}
  upload() {
    const stream = new PassThrough();
    setImmediate(() => {
      stream.emit('success');
    });
    return stream;
  }
}

module.exports = Client;
