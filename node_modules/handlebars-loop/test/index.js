var should = require('chai').should(),
    loop = require('../index.js');

describe('#loop(1, 15, 1)', function() {
  it('Final number equals 15', function() {
	loop(1, 15, 1).should.equal('123456789101112131415');
  });
});

describe('#loop(0, 10, 2)', function() {
  it('Final number equals 10', function() {
	loop(0, 10, 2).should.equal('0246810');
  });
});


describe('#loop(1, 5, .5)', function() {
  it('Final number equals 5', function() {
	loop(1, 5, .5).should.equal('11.522.533.544.55');
  });
});
