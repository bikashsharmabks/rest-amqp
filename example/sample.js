var restAMQP = require('../index').init();
var debug    = require('debug')('rest-amqp-sample');

restAMQP.get('/hi', function (req, res) {
    debug(req);
    debug(res);
});

restAMQP.listen();
