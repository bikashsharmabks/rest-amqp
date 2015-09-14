var restAMQP = require('../index').init();
var debug    = require('debug')('rest-amqp-sample');

restAMQP.get('/hi/:id', function (req, res) {
    debug(req);
    debug(res);
});

restAMQP.listen(8081);
