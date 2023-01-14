const { assert } = require('chai');

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, testUsers['userRandomID'])
  });
  it('should return undefined if an email is non existent', function(){
    const user = findUserByEmail("tester@test.com")
    assert.equal(user, undefined)
  })
});