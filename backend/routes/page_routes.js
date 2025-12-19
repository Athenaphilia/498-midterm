// routes/page_routes.js
// basic pages not covered by other routes

const express = require('express');
const { get_user } = require('../modules/user_helpers');

const router = express.Router();

// home
router.get('/', (req, res) => {
  res.render('home', {
    user: get_user(req.session)
  });
});

module.exports = router;
