// routes/profile_routes.js
const express = require('express');
const router = express.Router();
const { require_login } = require('../modules/auth');

const {
  validatePassword,
  hashPassword,
  comparePassword,
  is_valid_display_name
} = require('../modules/password_utils');

const db_utils = require('../modules/database_utils');


// GET profile page
router.get('/profile', require_login, (req, res) => {
  const user = db_utils.get_user_by_username(req.session.username);

  res.render('profile', {
    user,
  });
});

// POST change display name
router.post('/profile/display-name', require_login, (req, res) => {
  const { display_name } = req.body;

  const display_check = is_valid_display_name(display_name);
  if (!display_check.valid) {
    return res.render('profile', {
      user: db_utils.get_user_by_username(req.session.username),
      errors: display_check.errors
    });
  }

  const user = db_utils.get_user_by_username(req.session.username);
  db_utils.update_display_name(user.id, display_name);

  res.redirect('/profile');
});

// POST change password
router.post('/profile/password', require_login, async (req, res) => {
  const { old_password, new_password } = req.body;
  const user = db_utils.get_user_by_username(req.session.username);

  // Verify old password
  const old_ok = await comparePassword(old_password, user.password_hash);
  if (!old_ok) {
    return res.render('profile', {
      user,
      password_error: 'Current password is incorrect'
    });
  }

  // Validate new password
  const check = validatePassword(new_password);
  if (!check.valid) {
    return res.render('profile', {
      user,
      password_errors: check.errors
    });
  }

  // Update password
  const new_hash = await hashPassword(new_password);
  db_utils.update_password(user.id, new_hash);

  // Invalidate all sessions
  db_utils.delete_sessions_for_user(user.username);
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
