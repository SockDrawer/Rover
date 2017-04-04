'use strict';
const fs = require('fs-promise');
const dateFormat = require('dateformat');
const node_ssh = require('node-ssh');
const pm2 = require('pm2');



module.exports = {
    ssh: new node_ssh(),
    pm2_connect: function() {
      let promise = new Promise((resolve, reject) => {
        pm2.connect(function(err) {
            if (err) return reject(err);
            return resolve(pm2);
        });
      });
      return promise;
    },
    pm2_restart: function(process) {
        let promise = new Promise((resolve, reject) => {
            pm2.restart(process, function(err, proc) {
               if (err) return reject(err);
               return resolve(proc);
            });
        });
        return promise;
    },
    handle: function(body) {
        const zen = body.zen;
        const ssh = module.exports.ssh;
        const timestamp = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
        const line = `[${timestamp}] ${zen} \n`;
        
        return fs.appendFile('/home/rover/hooksreceived.log', line)
            .catch((err) => console.error(err))
            .then(() => ssh.connect({
                host: 'sockrpgtest.sockdrawer.io',
                username: 'rover',
                privateKey: '/home/rover/.ssh/id_rsa'
            }))
            .then(() => ssh.putFile('/home/rover/hooksreceived.log', '/home/rover/hooksreceived.log'))
            .then(() => module.exports.pm2_connect())
            .then(() => module.exports.pm2_restart('zoidberg'))
            .catch((err) => {
                return fs.appendFile('/home/rover/hooksreceived.log', `[${timestamp}] ERROR: ${err.toString()} \n`);
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