// routes/page_routes.js
const express = require('express');
const { get_user } = require('../modules/user_helpers');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', {
    user: get_user(req.session)
  });
});

module.exports = router;
