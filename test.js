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
    });
    
    afterEach(() => {
        fsp.appendFile.restore();
        oot.ssh.connect.restore();
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
    
    it("should ssh into the staging server", () => {
        return oot.handle({"zen": "What is the sound of one hand clapping?"}).then(() => {
            return oot.ssh.connect.should.have.been.calledWith({
                host: 'sockrpgtest.sockdrawer.io',
                username: 'rover',
                privateKey: '~/.ssh/id_rsa'
            });
        });
    });
});