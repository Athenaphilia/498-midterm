// modules/password-utils.js
// utilities for password hashing and comparing

const argon2 = require('argon2');

// Argon2 configuration options
// These values provide a good balance of security and performance
const ARGON2_OPTIONS = {
  type: argon2.argon2id,  // Uses a hybrid approach (best for most cases)
  memoryCost: 65536,      // 64 MB memory cost
  timeCost: 3,            // Number of iterations
  parallelism: 4          // Number of parallel threads
};

/*
validatePassword takes a password and checks to see if
it passes some standard requirements (like length, an uppercase, etc)
*/
function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  // password length >- 8
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  // must contain capital letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  // must contain lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  // must contain 1 number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  // must contain 1 special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// simple function that will hash a password.
async function hashPassword(password) {
  return await argon2.hash(password, ARGON2_OPTIONS);
}


// Compares a plain text password with a hashed password

async function comparePassword(password, hash) {
  return await argon2.verify(hash, password);
}

// check if display name is valid
function is_valid_display_name(display_name) {
  const errors = [];
  // must be at least length 5
  if (display_name.length < 5) {
    errors.push('Password must be at least 5 characters long');
  }

  // must contain no special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(display_name)) {
    errors.push("Display names may not contain special characters.");
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  validatePassword,
  hashPassword,
  comparePassword,
  is_valid_display_name
};
