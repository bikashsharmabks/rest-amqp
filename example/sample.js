var restAMQP = require('../index').init();
var debug    = require('debug')('rest-amqp-sample');

restAMQP.get('/hi/:id', function (req, res) {
    debug('here i need to write business logic');
    res.send(200, {name: req.params.id});
});

restAMQP.listen(8081);
