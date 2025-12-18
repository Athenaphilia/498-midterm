// routes/auth_routes.js
const express = require('express');
const {
  validatePassword,
  hashPassword,
  comparePassword,
  is_valid_display_name
} = require('../modules/password_utils');
const db_utils = require('../modules/database_utils');
const { get_user } = require('../modules/user_helpers');

const router = express.Router();

const MAX_FAILED = 5;
const LOCKOUT_MINUTES = 15;

function is_account_locked(user) {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
}

function lock_until_timestamp() {
  return new Date(
    Date.now() + LOCKOUT_MINUTES * 60 * 1000
  ).toISOString();
}

// register page
router.get('/register', (req, res) => {
  res.render('register', {
    user: get_user(req.session)
  });
});

// register submit
router.post('/register', async (req, res) => {
  const { username, password, display_name } = req.body;

  if (!username || !password || !display_name) {
    return res.render('register', { error: 'Fields missing.' });
  }

  const password_check = validatePassword(password);
  if (!password_check.valid) {
    return res.render('register', {
      error_messages: password_check.errors
    });
  }
  const display_check = is_valid_display_name(display_name);
  if (!display_check.valid) {
    return res.render('register', {
      error_messages: display_check.errors
    });
  }

  if (db_utils.get_user_by_username(username)) {
    return res.render('register', { error: 'Username already taken' });
  }

  try {
    const password_hash = await hashPassword(password);
    const profile = { name_color: '#ffffff' };

    db_utils.create_user(
      username,
      password_hash,
      display_name,
      JSON.stringify(profile)
    );

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Registration failed' });
  }
});

// login page
router.get('/login', (req, res) => {
  res.render('login', {
    user: get_user(req.session)
  });
});

// login submit
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  const user = db_utils.get_user_by_username(username);

  // Username does not exist
  if (!user) {
    db_utils.record_login_attempt(username, ip, Date.now(), false);
    return res.render('login', { login_error: 1 });
  }

  // Account locked
  if (is_account_locked(user)) {
    db_utils.record_login_attempt(username, ip, Date.now(), false);
    return res.render('login', {
      locked: true,
      locked_until: user.locked_until
    });
  }

  const password_ok = await comparePassword(password, user.password_hash);

  if (!password_ok) {
    db_utils.record_login_attempt(username, ip, Date.now(), false);
    db_utils.increment_failed_attempts(user.id);

    // Lock if threshold reached
    if (user.failed_attempts + 1 >= MAX_FAILED) {
      db_utils.lock_account(user.id, lock_until_timestamp());
    }

    return res.render('login', { login_error: 1 });
  }

  // Login successful
  db_utils.record_login_attempt(username, ip, Date.now(), true);
  db_utils.reset_failed_attempts(user.id);

  req.session.isLoggedIn = true;
  req.session.username = username;
  req.session.loginTime = new Date().toISOString();
  req.session.visitCount = 0;

  db_utils.create_session(
    req.sessionID,
    username,
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );

  res.redirect('/');
});



// logout
router.post('/logout', (req, res) => {
  if (req.sessionID) {
    db_utils.delete_session(req.sessionID);
  }

  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
