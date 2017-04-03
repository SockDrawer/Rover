'use strict'
const fs = require('fs-promise');

module.exports = {
    handle: function(body) {
        const zen = body.zen;
        return fs.appendFile('/home/rover/hooksreceived.log', zen);
    }
}

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/updated', function (req, res, next) {
    return module.exports
    .handle(req.body)
    .then(() => res.sendStatus(200))
    .catch(next)
});

app.listen(3000, function () {
  console.log('Listening on port 3000!')
});