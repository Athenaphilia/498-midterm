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
  res.render('comments', {
    user: get_user(req.session),
    comments: db_utils.get_comments(100, 0)
  });
});

module.exports = router;
