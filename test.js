var fsp = require('fs-promise');
var Sinon = require('sinon');
var Chai  = require('chai');
Chai.should();
Chai.use(require('sinon-chai'));

describe("webhooks", function() {
    beforeEach(() => {
        Sinon.stub(fsp, "appendFile");
    });
    
    afterEach(() => {
        fsp.appendFile.restore();
    });
    
    it("should listen for requests and write to a file", () => {
        var oot = require('./index');
        fsp.appendFile.resolves();
        return oot.handle({"json": "here"}).then(() => {
            //check for file write here
            return fsp.appendFile.should.have.been.called;
        });
    });

    it("should log the zen", () => {
        var oot = require('./index');
        fsp.appendFile.resolves();
        return oot.handle({"zen": "What is the sound of one hand clapping?"}).then(() => {
            //check for file write here
            fsp.appendFile.should.have.been.called;
            return fsp.appendFile.firstCall.args[1].should.contain("the sound of one hand clapping?");
        });
    });
});