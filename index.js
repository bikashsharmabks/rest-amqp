
var debug   = require('debug')('rest-amqp');

var uuid    = require('node-uuid');
var Rest    = require('./lib/rest');
var Amqp    = require('./lib/amqp');

function send(req, res, next) {
    res.send('Hello from rest-amqp');
    return next();
}

function RestAmqp(opt) {

    if (!opt) {
        opt = {};
    }
    this.opt = opt;

    this.__amqp = {};
    this.__amqp.url =
        opt.amqp_url ? opt.amqp_url : 'amqp://guest:guest@localhost:5672';

    this.__amqp.exchange_name =
       opt.amqp_exchange ? opt.amqp_exchange : 'work-exchange';

    this.__amqp.default_queue =
       opt.default_queue ? opt.default_queue : 'work-queue';

    this.__amqp.reply_to_queue =
       opt.reply_to_queue ? opt.reply_to_queue : 'reply-queue';

    this.__amqp.exchange_options =
       opt.amqp_exchange_options ? opt.amqp_exchange_options :
       {exclusive: false, autoDelete: true };

    this.__amqp.impl_options =
        opt.amqp_ipml_options ||
            {defaultExchangeName: this.__amqp.exchange_name};

    this.__amqp.conn_options =
       opt.amqp_conn_options || {};

    this.__http = {};
    this.__http.port =
        opt.http_port ? opt.http_port : '8080';

    this.routes = [];

    rest = new Rest(this.__http);
    amqp = new Amqp(this.__amqp);

}

RestAmqp.prototype.listen = function (port) {
    var self = this;
    this.__http.port =
        port ? port : this.__http.port;

    rest.init();

    rest.http.get('/http-heartbeat', send);

    rest.http.listen(this.__http.port, function () {
        debug('%s listening at %s', rest.http.name, rest.http.url);
        makeRoutes(rest.http, self.routes);
        amqp.init();
    });
};

[
    'del',
    'get',
    'head',
    'opts',
    'post',
    'put',
    'patch'
].forEach(function (method) {
    RestAmqp.prototype[method] = function () {

        if (arguments.length < 2) {
            throw new TypeError('handler (function) required');
        }

        var args = Array.prototype.slice.call(arguments);

        var path = args[0];
        var queue = this.__amqp.default_queue;
        var callback = args[1];

        if (arguments.length == 3) {
            queue = args[1];
            callback = args[2];
        }

        if (typeof (path) !== 'string') {
            throw new TypeError('path (string) required');
        };

        var route = {
            id : uuid.v4(),
            queue : queue,
            routingKey: makeRequestRoutingKey(method, path),
            replyTo : this.__amqp.reply_to_queue,
            method : method,
            path: path
        };

        this.routes.push(route);

        callback('request', 'response');
    };
});

function makeRequestRoutingKey (method, path) {
    var routingKey = 'REQUEST.WORK.' + method.toUpperCase() + path.replace(/\//g, '.');
    return routingKey;
}

function makeRoutes(http, routes) {
    routes.forEach(function (route) {
        debug(route);
        makeRoute(http, route);
    });
}

function makeRoute(http, route) {
    http[route.method](route.path, function (req, res) {
        var message = makeMessage(req);
        publishMessage(message);
        debug(message);
        res.send(message);
    });
}

function makeMessage (req) {
    var message = {};
    message.params = req.params;
    message.url = req.url;
    message.query = req.query;
    message.method = req.method;
    message.path = req.route.path;
    message.routingKey = makeRequestRoutingKey(message.method, message.path);

    return message;
}

function publishMessage (message) {
    var options = {mandatory: true, deliveryMode: message.method == 'GET' ? 1 : 2};
    amqp.exchange.publish(message.routingKey, message, options,
        function (err, data) {
            debug(data);
        });
}

module.exports.init = function (opt) {
    return new RestAmqp(opt);
};
