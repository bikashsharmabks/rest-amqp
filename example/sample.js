var restAMQP = require('../index').init();
var debug    = require('debug')('rest-amqp-sample');

debug('hello from sample');

restAMQP.listen();
