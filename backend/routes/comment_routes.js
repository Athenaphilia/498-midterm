// routes/comment_routes.js
const express = require('express');
const db_utils = require('../modules/database_utils');
const { get_user } = require('../modules/user_helpers');
const { require_login } = require('../modules/auth');

const router = express.Router();

const COMMENT_PER_PAGE = 20;

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
  res.redirect('/comments/0');
})

router.get('/comments/:offset', (req, res) => {
  const offset = Number(req.params.offset) || 0;
  const comments = db_utils.get_comments(COMMENT_PER_PAGE, offset);
  const next = offset + COMMENT_PER_PAGE;
  const prev = Math.max(0, offset - COMMENT_PER_PAGE);

  // each comment has: display_name, profile_customization
  comments.forEach(c => {
    const customization = JSON.parse(c.profile_customization || '{}');
    c.name_color = customization.name_color || '#ffffff';
  });
  res.render('comments', {
    user: get_user(req.session),
    comments: comments,
    next,
    prev,
    offset
  });
});

module.exports = router;
