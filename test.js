var fsp = require('fs-promise');
var Sinon = require('sinon');
var Chai  = require('chai');
Chai.should();
Chai.use(require('sinon-chai'));

describe("webhooks", function() {
    var oot = require('./index');

    beforeEach(() => {
        Sinon.stub(fsp, "appendFile").resolves();
        Sinon.stub(oot.ssh, "connect").resolves();
        Sinon.stub(oot.ssh, "putFile").resolves();
    });
    
    afterEach(() => {
        fsp.appendFile.restore();
        oot.ssh.connect.restore();
        oot.ssh.putFile.restore();
    });
    
    it("should listen for requests and write to a file", () => {
        return oot.handle({"json": "here"}).then(() => {
            //check for file write here
            return fsp.appendFile.should.have.been.called;
        });
    });

    it("should log the zen", () => {
        return oot.handle({"zen": "What is the sound of one hand clapping?"}).then(() => {
            //check for file write here
            fsp.appendFile.should.have.been.called;
            return fsp.appendFile.firstCall.args[1].should.contain("the sound of one hand clapping?");
        });
    });

    it("should log timestamps", () => {
        var clock = Sinon.useFakeTimers();
        return oot.handle({"zen": "What is the sound of one hand clapping?"}).then(() => {
            clock.restore();
            fsp.appendFile.should.have.been.called;
            return fsp.appendFile.firstCall.args[1].should.contain("[Jan 01 1970 00:00:00]");
        });
    });
    
    it("should handle log errors", () => {
       Sinon.stub(console, "error");
       const err = new Error("I AM ERROR");
       fsp.appendFile.rejects(err);
       return oot.handle({"zen": "stuff"}).then(() => {
           console.error.should.have.been.calledWith(err);
           console.error.restore();
       });
    });
    
    it("should ssh into the staging server", () => {
        return oot.handle({"zen": "What is the sound of one hand clapping?"}).then(() => {
            return oot.ssh.connect.should.have.been.calledWith({
                host: 'sockrpgtest.sockdrawer.io',
                username: 'rover',
                privateKey: '~/.ssh/id_rsa'
            });
        });
    });

    it("should copy its log to the remote server", () => {
        return oot.handle({"zen": "What is the sound of one hand clapping?"}).then(() => {
            return oot.ssh.putFile.should.have.been.calledWith('/home/rover/hooksreceived.log', '/home/rover/hooksreceived.log');
        });
    });
    
    it("should handle ssh errors on connect", () => {
       const err = new Error("I AM ERROR");
       oot.ssh.connect.rejects(err);
       return oot.handle({"zen": "stuff"}).then(() => {
           fsp.appendFile.should.have.been.calledTwice;
           fsp.appendFile.secondCall.args[1].should.include('I AM ERROR');
       });
    });
});