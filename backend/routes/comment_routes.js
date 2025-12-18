// routes/comment_routes.js
const express = require('express');
const db_utils = require('../modules/database_utils');
const { get_user } = require('../modules/user_helpers');
const { require_login } = require('../modules/auth');

const router = express.Router();

router.get('/comment/new', require_login, (req, res) => {
  res.render('new-comment', {
    user: get_user(req.session)
  });
});

router.post('/comment', require_login, (req, res) => {
  const { comment_text } = req.body;
  const user = db_utils.get_user_by_username(req.session.username);

  db_utils.create_comment(
    user.id,
    comment_text,
    new Date().toISOString()
  );

  res.redirect('/comments');
});

router.get('/comments', (req, res) => {
  const comments = db_utils.get_comments(50, 0);

  // each comment has: display_name, profile_customization
  comments.forEach(c => {
    const customization = JSON.parse(c.profile_customization || '{}');
    c.name_color = customization.name_color || '#ffffff';
  });
  res.render('comments', {
    user: get_user(req.session),
    comments: comments
  });
});

module.exports = router;
