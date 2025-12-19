const express = require('express');
const router = express.Router();
const db_utils = require('../modules/database_utils');
const { require_login } = require('../modules/auth');
const { get_user } = require('../modules/user_helpers');

router.get('/chat', require_login, (req, res) => {
  res.render('chat', {
    user: get_user(req.session)
  });
});

// Get chat history
router.get('/api/chat', require_login, (req, res) => {
  const messages = db_utils.get_chat_history(100, 0);

  const enriched = messages.map(m => {
    const customization = JSON.parse(m.profile_customization || '{}');
    return {
      body: m.body,
      timestamp: m.timestamp,
      display_name: m.display_name,
      name_color: customization.name_color || '#ffffff'
    };
  });

  res.json(enriched);
});

// Send chat message
router.post('/api/chat', require_login, (req, res) => {
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const user = db_utils.get_user_by_username(req.session.username);
  const timestamp = new Date().toISOString();

  db_utils.create_chat_message(user.id, message.trim(), timestamp);

  res.json({ success: true });
});

module.exports = router;
