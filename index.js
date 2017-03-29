'use strict'
const fs = require('fs-promise');

module.exports = {
    handle: function() {
        return fs.appendFile('/home/rover/hooksreceived.log', 'got file');
    }
}

var express = require('express')
var app = express()

app.get('/updated', function (req, res, next) {
    return module.exports
    .handle()
    .then(() => res.sendStatus(200))
    .catch(next)
});

app.listen(3000, function () {
  console.log('Listening on port 3000!')
});