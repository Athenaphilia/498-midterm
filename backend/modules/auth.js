// modules/auth.js

function require_login(req, res, next) {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
}

module.exports = {
  require_login
};
