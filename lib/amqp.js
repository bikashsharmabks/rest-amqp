var debug   = require('debug')('amqp-component');
var amqp    = require('amqp');
var uuid    = require('node-uuid');

var Amqp = module.exports = function Amqp (opt) {
    this.__amqp = opt;
};


Amqp.prototype.response;

Amqp.prototype.onWorkMessage;
Amqp.prototype.onReplyMessage;

Amqp.prototype.init = function () {
    var self = this;
    var options = this.__amqp.conn_options;

    self.__amqp.reply_to_queue = self.__amqp.reply_to_queue + '-' + uuid.v4();

    if (!options.url && !options.host) {
        options.url = this.__amqp.url;
    }
    debug('createConnection options=', options,
        ', ipml_options=', this.__impl_options || {});

    this.amqp_conn = amqp.createConnection(
      options,
        this.__impl_options
    );

    this.amqp_conn.on('ready', function () {
        self.setUpExchanges();
    });
};

function subscribeReplyQueue (self, replyQueue) {
    replyQueue.subscribe(function (message) {
        debug('Got a message replyQueue');
        self.onReplyMessage(message);
    });
};

function subscribeWorkQueue (self, workQueue) {
    workQueue.subscribe(function (message) {
        debug('Got a message Work Queue');
        self.onWorkMessage(message);
    });
};

Amqp.prototype.setUpExchanges = function () {
    var self = this;
    self.amqp_conn.exchange(self.__amqp.exchange_name, { type: 'topic'},
        function (exchange) {
            self.exchange = exchange;
            var options = {autoDelete: false, exclusive: false, durable: false};
            self.amqp_conn.queue(self.__amqp.default_queue, options,
                function (q) {
                self.routes.forEach(function (route) {
                    q.bind(exchange, route.routingKey);
                    subscribeWorkQueue(self, q);
                    debug('binding created');
                });
            });
        });

    var replyToOptions = {'autoDelete': true, 'exclusive': true, 'durable': false };
    self.amqp_conn.queue(self.__amqp.reply_to_queue, replyToOptions, function (q) {
        debug('connected to replyto');
        q.bind(self.exchange, 'RESPONSE.#');
        subscribeReplyQueue(self, q);
    });
};
