var restify = require('restify');
var debug   = require('debug')('rest-amqp');
var amqp    = require('amqp');

function send(req, res, next) {
    res.send('hello ' + req.params.name);
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

    this._initHttp();
    this._initAmqp();
}

RestAmqp.prototype._initHttp = function () {
    this.http = restify.createServer({
        name:'rest-amqp-http'
    });
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
        debug('connected to ' + self.amqp_conn.serverProperties.product);
    });
};

RestAmqp.prototype.listen = function () {
    this.http.listen(this.__http.port);

    this.http.get('/hello/:name', send);

    debug('listening on port:' + this.__http.port);
};

module.exports.init = function (opt) {
    return new RestAmqp(opt);
};
