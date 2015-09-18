var debug   = require('debug')('rest-component');
var restify = require('restify');
var uuid    = require('node-uuid');

var Rest = module.exports = function Rest (opt) {
    this.__http = opt;
};

Rest.prototype.init = function () {
    this.http = restify.createServer({
        name:'rest-amqp-http'
    });

    this.http.use(restify.queryParser());
    this.http.use(restify.bodyParser());
};
