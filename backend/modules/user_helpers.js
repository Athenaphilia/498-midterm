// modules/user_helpers.js
// used by many routes to get a user object to pass to handlebars

function get_user(session) {
  // return guest user, since null would break html
  if (!session.isLoggedIn) {
    return {
      name: 'Guest',
      isLoggedIn: false,
      loginTime: null,
      visitCount: 0
    };
  }

  session.visitCount = (session.visitCount || 0) + 1;

  return {
    username: session.username,
    isLoggedIn: true,
    loginTime: session.loginTime,
    visitCount: session.visitCount
  };
}

module.exports = {
  get_user
};
