// Function for finding user by their email
const findUserByEmail = function(email, database) {
  for (let uid in database) {
    if (database[uid].email === email) {
      return database[uid];
    }
  }
  return undefined;
};

module.exports = { findUserByEmail }