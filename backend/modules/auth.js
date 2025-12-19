// modules/auth.js
// file that can be imported if needed

// used as middleware for any route that needs to require a login
function require_login(req, res, next) {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
}

module.exports = {
  require_login
};
