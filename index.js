'use strict';
const fs = require('fs-promise');
const dateFormat = require('dateformat');
const node_ssh = require('node-ssh');
const pm2 = require('pm2');
const SlackBot = require('slackbots');


//Stuff that will eventually be in a config file
const host = 'sockrpgtest.sockdrawer.io';
const botList = ['sockbot', 'zoidberg'];
const pullList = ['/usr/local/sockbot/SockBot'];
const slackToken = process.env.SLACK_TOKEN || 'invalid';
const slackbotName = 'Rover';
const slackChannel = '#cd-project';
const logfile = '/home/rover/hooksreceived.log';
const logfileRemote = logfile;
const keyfile = '/home/rover/.ssh/id_rsa';

/**
 * Log a message
 * @method log
 * @param {} msg The message to log
 * @return Promise that resolves when the log is done
 */
function log(msg) {
    const timestamp = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    const line = `[${timestamp}] ${msg} \n`;
    return fs.appendFile(logfile, line);
}

module.exports = {
    ssh: new node_ssh(),
    slackbot: undefined,
    /**
     * Connect to PM2
     * @method pm2_connect
     * @return promise that resolves to a connected PM2 instance
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
     * Restart pm2
     * @method pm2_restart
     * @param {} process the process to restart
     * @return promise that resolves to the restarted process
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
     * Handle an incoming call
     * @method handle
     * @param {} body The body of the request
     * @return Promise resolves when the handler is ready for another request
     */
    handle: function(body) {
        const zen = body.zen;
        const ssh = module.exports.ssh;
        
            
        /**
         * Restart a single bot
         * @method restartBot
         * @param {} name The name of the bot to restart
         * @return Promise a promise that resolves when the bot is restarted
         */
        function restartBot(name) {
            return module.exports.pm2_restart(name)
                    .then(() => log(`Restarted ${name}`));
        }
        
        /**
         * Execute a git pull on a directory
         * @method pull
         * @param {} dir The diretory to pull
         * @return Promise A promise that resolves when the pull is done
         */
        function pull (dir) {
            return ssh.exec('git pull', [], { cwd: dir});
        }
        
        if (!module.exports.slackbot) {
            module.exports.slackbot = new SlackBot({
                token: slackToken, 
                name: slackbotName
            });
        }
        
        return log(zen)
            .catch((err) => console.error(err))
            .then(() => ssh.connect({
                host: host,
                username: 'rover',
                privateKey: keyfile
            }))
            .then(() => module.exports.pm2_connect())
            .then(() => Promise.all(botList.map(restartBot)))
            .then(() => pm2.disconnect())
            .then(() => ssh.putFile(logfile, logfileRemote))
            .then(() => Promise.all(pullList.map(pull)))
            .then(() => module.exports.slackbot.postMessageToChannel(slackChannel, "Sockbot updated!"))
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