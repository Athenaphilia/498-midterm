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
const { get_user } = require('../modules/user_helpers');


// GET profile page
router.get('/profile', require_login, (req, res) => {
  const user = db_utils.get_user_by_username(req.session.username);
  const customization = db_utils.get_profile_customization(user.id);

  res.render('profile', {
    user: get_user(req.session),
    customization
  });
});

// POST change display name
router.post('/profile/display-name', require_login, (req, res) => {
  const { display_name } = req.body;

  const display_check = is_valid_display_name(display_name);
  if (!display_check.valid) {
    return res.render('profile', {
      user: get_user(req.session),
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
      user: get_user(req.session),
      password_error: 'Current password is incorrect'
    });
  }

  // Validate new password
  const check = validatePassword(new_password);
  if (!check.valid) {
    return res.render('profile', {
      user: get_user(req.session),
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

router.post('/profile/customization', require_login, (req, res) => {
  const { name_color } = req.body;
  const user = db_utils.get_user_by_username(req.session.username);

  // Is it a hex color
  if (!/^#[0-9A-Fa-f]{6}$/.test(name_color)) {
    return res.render('profile', {
      user: get_user(req.session),
      customization: db_utils.get_profile_customization(user.id),
      customization_error: 'Invalid color format'
    });
  }

  const customization = db_utils.get_profile_customization(user.id);
  customization.name_color = name_color;

  db_utils.update_profile_customization(user.id, customization);

  res.redirect('/profile');
});


module.exports = router;
