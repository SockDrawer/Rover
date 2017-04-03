'use strict';
const fs = require('fs-promise');
const dateFormat = require('dateformat');
const node_ssh = require('node-ssh');


module.exports = {
    ssh: new node_ssh(),
    handle: function(body) {
        const zen = body.zen;
        const ssh = module.exports.ssh;
        const timestamp = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
        const line = `[${timestamp}] ${zen}`;
        
        return fs.appendFile('/home/rover/hooksreceived.log', line)
            .catch((err) => console.error(err))
            .then(() => ssh.connect({
                host: 'sockrpgtest.sockdrawer.io',
                username: 'rover',
                privateKey: '~/.ssh/id_rsa'
            }))
            .then(() => ssh.putFile('/home/rover/hooksreceived.log', '/home/rover/hooksreceived.log'))
            .catch((err) => {
                return fs.appendFile('/home/rover/hooksreceived.log', `[${timestamp}] ERROR: ${err.toString()}`);
            });
    }
};

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

app.post('/updated', function (req, res, next) {
    return module.exports.handle(req.body)
    .then(() => res.sendStatus(200))
    .catch(next)
});

app.listen(3000, function () {
  console.log('Listening on port 3000!')
});