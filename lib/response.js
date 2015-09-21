

function Response() {
}

var Response = module.exports = function Response (id) {
    this.messageId = id;
};

Response.prototype.onSend;

Response.prototype.send = function (code, body) {
    this.code = code;
    this.body = body;
    this.onSend(code, body);
};
