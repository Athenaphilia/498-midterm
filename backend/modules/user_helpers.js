// modules/user_helpers.js

function get_user(session) {
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
