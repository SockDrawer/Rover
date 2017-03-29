var fsp = require('fs-promise');
var Sinon = require('sinon');
var Chai  = require('chai');
Chai.should();
Chai.use(require('sinon-chai'));

describe("webhooks", function() {
    it("should listen for requests and write to a file", () => {
        var oot = require('./index');
        Sinon.stub(fsp, "appendFile").resolves();
        return oot.handle('{"json": "here"}').then(() => {
            //check for file write here
            return fsp.appendFile.should.have.been.called;
        });
    });
    
    afterEach(function() {
        fsp.appendFile.restore();
    });
});