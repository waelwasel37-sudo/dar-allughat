const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrdarallughat97483992f = onRequest({}, (req, res) => server.then(it => it.handle(req, res)));
  