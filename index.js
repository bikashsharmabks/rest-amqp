var restify = require('restify');
var debug = require('debug')('rest-amqp');
var server = restify.createServer({
    name:'MyApp'
});

function send(req, res, next) {
    res.send('hello ' + req.params.name);
    return next();
}

server.get('/hello/:name', send);

server.listen(8080);

debug('listening on port 8080');
