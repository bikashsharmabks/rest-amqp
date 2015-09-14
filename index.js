var restify = require('restify');
var debug   = require('debug')('rest-amqp');
var amqp    = require('amqp');
var uuid    = require('node-uuid');

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
}

RestAmqp.prototype._initHttp = function () {
    this.http = restify.createServer({
        name:'rest-amqp-http'
    });

    this.http.use(restify.queryParser());
    this.http.use(restify.bodyParser());
};

RestAmqp.prototype._initAmqp = function () {
    var self = this;
    var options = this.__amqp.conn_options;

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
        //debug('connected to ' + self.amqp_conn.serverProperties.product);
    });
};

RestAmqp.prototype.setUpExchanges = function () {
    var self = this;
    self.amqp_conn.exchange(self.__amqp.exchange_name, { type: 'topic'},
        function (exchange) {
            var options = {autoDelete: false, exclusive: false, durable: false};
            self.amqp_conn.queue(self.__amqp.default_queue, options,
                function (q) {
                self.routes.forEach(function (route) {
                    q.bind(exchange, route.routingKey);
                    debug('binding created');
                });
            });
        });
};

RestAmqp.prototype.listen = function (port) {
    var self = this;
    this.__http.port =
        port ? port : this.__http.port;

    this._initHttp();

    this.http.get('/http-heartbeat', send);

    this.http.listen(this.__http.port, function () {
        debug('%s listening at %s', self.http.name, self.http.url);
        makeRoutes(self.http, self.routes);
        self._initAmqp();
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
            path: path,
            url : '',
            body: {},
            params : {},
            query : {},
            header : [],
            cb : callback
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
        route.params = req.params;
        route.url = req.url;
        route.query = req.query;
        route.method = req.method;
        debug(route);
        res.send('This is test');
    });
}

function publishMessage(message) {
    var self = this;
    var options = {mandatory: true, deliveryMode: req.method == 'GET' ? 1 : 2 };
    //self.amqp_conn.exchange.publish(route.routingKey, route,)
}

module.exports.init = function (opt) {
    return new RestAmqp(opt);
};
