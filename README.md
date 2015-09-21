# rest-amqp
Rest API using amqp protocol build on nodejs
http://bikashsharmabks.github.io/rest-amqp

Topic Exchange library based on AMQP protocol.
Tested with RabbitMQ on the highload project.


###Install RabitMQ
    apt-get install rabbitmq-server

###Sample code in sample.js
    var restAMQP = require('../index').init();
    var debug    = require('debug')('rest-amqp-sample');

    restAMQP.get('/hi/:id', function (req, res) {
        debug('here i need to write business logic');
        res.send(200, {name: req.params.id});
    });
    
    restAMQP.listen(8081);

###Output
    GET http://localhost:8081/hi/aj?a=1
    {
        "name": "aj"
    }
    
