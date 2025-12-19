// routes/comment_routes.js
const express = require('express');
const db_utils = require('../modules/database_utils');
const { get_user } = require('../modules/user_helpers');
const { require_login } = require('../modules/auth');
const { renderMarkdown } = require('../modules/markdown');

const router = express.Router();

const COMMENTS_PER_PAGE = 20;

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

  const total = db_utils.get_comment_count();
  const comments = db_utils.get_comments(COMMENTS_PER_PAGE, offset);

  const current_page = Math.floor(offset / COMMENTS_PER_PAGE) + 1;
  const total_pages = Math.ceil(total / COMMENTS_PER_PAGE);

  const prev_offset = Math.max(0, offset - COMMENTS_PER_PAGE);
  const next_offset = offset + COMMENTS_PER_PAGE < total ? offset + COMMENTS_PER_PAGE : null;

  const has_prev = offset > 0;


  comments.forEach(c => {
    const customization = JSON.parse(c.profile_customization || '{}');
    c.name_color = customization.name_color || '#ffffff';
    c.body = renderMarkdown(c.body);
  });

  // Build page numbers
  const pages = [];
  for (let i = 1; i <= total_pages; i++) {
    pages.push({
      number: i,
      offset: (i - 1) * COMMENTS_PER_PAGE,
      is_current: i === current_page
    });
  }
  res.render('comments', {
    user: get_user(req.session),
    comments,
    total,
    current_page,
    total_pages,
    prev_offset,
    has_prev,
    next_offset,
    pages
  });
});

module.exports = router;
