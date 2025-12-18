// routes/auth_routes.js
const express = require('express');
const {
  validatePassword,
  hashPassword,
  comparePassword
} = require('../modules/password_utils');
const db_utils = require('../modules/database_utils');
const { get_user } = require('../modules/user_helpers');

const router = express.Router();

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

  if (db_utils.get_user_by_username(username)) {
    return res.render('register', { error: 'Username already taken' });
  }

  try {
    const password_hash = await hashPassword(password);
    const profile = { name_color: '#FFFFFF', avatar: 'default', bio: '' };

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

  const user = db_utils.get_user_by_username(username);
  if (!user) {
    return res.render('login', { login_error: 1 });
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    return res.render('login', { login_error: 1 });
  }

  req.session.isLoggedIn = true;
  req.session.username = username;
  req.session.loginTime = new Date().toISOString();
  req.session.visitCount = 0;

  db_utils.create_session(
    req.sessionID,
    username,
    new Date(Date.now() + 86400000).toISOString()
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
