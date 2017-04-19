'use strict';
const fs = require('fs-promise');
const dateFormat = require('dateformat');
const node_ssh = require('node-ssh');
const pm2 = require('pm2');
const SlackBot = require('slackbots');
const slackToken = process.env.SLACK_TOKEN || 'invalid';

/**
 * Description
 * @method log
 * @param {} msg
 * @return CallExpression
 */
function log(msg) {
    const timestamp = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    const line = `[${timestamp}] ${msg} \n`;
    return fs.appendFile('/home/rover/hooksreceived.log', line);
}

        
const botList = ['sockbot', 'zoidberg'];
const pullList = ['/usr/local/sockbot/SockBot'];


module.exports = {
    ssh: new node_ssh(),
    slackbot: undefined,
    /**
     * Description
     * @method pm2_connect
     * @return promise
     */
    pm2_connect: function() {
      let promise = new Promise((resolve, reject) => {
        pm2.connect(function(err) {
            if (err) return reject(err);
            return resolve(pm2);
        });
      });
      return promise;
    },
    /**
     * Description
     * @method pm2_restart
     * @param {} process
     * @return promise
     */
    pm2_restart: function(process) {
        let promise = new Promise((resolve, reject) => {
            pm2.restart(process, function(err, proc) {
               if (err) return reject(err);
               return resolve(proc);
            });
        });
        return promise;
    },
    /**
     * Description
     * @method handle
     * @param {} body
     * @return CallExpression
     */
    handle: function(body) {
        const zen = body.zen;
        const ssh = module.exports.ssh;
        
            
        /**
         * Description
         * @method restartBot
         * @param {} name
         * @return CallExpression
         */
        function restartBot(name) {
            return module.exports.pm2_restart(name)
                    .then(() => log(`Restarted ${name}`));
        }
        
        /**
         * Description
         * @method pull
         * @param {} dir
         * @return CallExpression
         */
        function pull (dir) {
            return ssh.exec('git pull', [], { cwd: dir});
        }
        
        if (!module.exports.slackbot) {
            module.exports.slackbot = new SlackBot({
                token: slackToken, 
                name: 'Rover'
            });
        }
        
        return log(zen)
            .catch((err) => console.error(err))
            .then(() => ssh.connect({
                host: 'sockrpgtest.sockdrawer.io',
                username: 'rover',
                privateKey: '/home/rover/.ssh/id_rsa'
            }))
            .then(() => module.exports.pm2_connect())
            .then(() => Promise.all(botList.map(restartBot)))
            .then(() => pm2.disconnect())
            .then(() => ssh.putFile('/home/rover/hooksreceived.log', '/home/rover/hooksreceived.log'))
            .then(() => Promise.all(pullList.map(pull)))
            .then(() => module.exports.slackbot.postMessageToChannel('#cd-project', "Sockbot updated!"))
            .catch((err) => {
                return log(`ERROR: ${err.toString()}`);
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
    .catch(next);
});

app.listen(3000, function () {
  console.log('Listening on port 3000!');
});