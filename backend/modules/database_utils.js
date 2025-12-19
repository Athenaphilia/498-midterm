// modules/db_utils.js
// all database functions used by the application

const db = require('./database');

// users

// creates a user with parameters
function create_user(username, password_hash, display_name, profile_customization = null) {
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, profile_customization)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username, password_hash, display_name, profile_customization);
}

// gets user with parameter id
function get_user_by_id(user_id) {
  const stmt = db.prepare(`
    SELECT id, username, display_name, profile_customization
    FROM users
    WHERE id = ?
  `);
  return stmt.get(user_id);
}

// gets the user with the matching username
function get_user_by_username(username) {
  const stmt = db.prepare(`
    SELECT *
    FROM users
    WHERE username = ?
  `);
  return stmt.get(username);
}

// updates the profile customization, must be JSON
function update_profile_customization(user_id, profile_customization) {
  const stmt = db.prepare(`
    UPDATE users
    SET profile_customization = ?
    WHERE id = ?
  `);
  return stmt.run(JSON.stringify(profile_customization), user_id);
}

// sessions

// creates a session with parameters
function create_session(id, username, expires) {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, username, expires)
    VALUES (?, ?, ?)
  `);
  return stmt.run(id, username, expires);
}

// gets a session with parameter id
function get_session(id) {
  const stmt = db.prepare(`
    SELECT *
    FROM sessions
    WHERE id = ?
  `);
  return stmt.get(id);
}

// deletes a session with parameter id
function delete_session(id) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE id = ?
  `);
  return stmt.run(id);
}

// deletes all sessions with date < date provided
function delete_expired_sessions(now_iso) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE expires < ?
  `);
  return stmt.run(now_iso);
}

// Comments

// add a comment with parameters
function create_comment(author_id, body, timestamp) {
  const stmt = db.prepare(`
    INSERT INTO comments (author, body, timestamp)
    VALUES (?, ?, ?)
  `);
  return stmt.run(author_id, body, timestamp);
}

// get comments with limit and offset, with display name and customization
function get_comments(limit = 20, offset = 0) {
  const stmt = db.prepare(`
    SELECT
      comments.id,
      comments.body,
      comments.timestamp,
      users.display_name AS author_display_name,
      users.profile_customization AS profile_customization
    FROM comments
    LEFT JOIN users ON comments.author = users.id
    ORDER BY comments.timestamp ASC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
}

// deletes comment with id
function delete_comment(comment_id) {
  const stmt = db.prepare(`
    DELETE FROM comments
    WHERE id = ?
  `);
  return stmt.run(comment_id);
}

// gets the total amount of comments
function get_comment_count() {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM comments;
  `);
  return stmt.get().count;
}

// login attempts

// add login attempt with parameters
function record_login_attempt(username, ip, timestamp, success) {
  const stmt = db.prepare(`
    INSERT INTO login_attempts (ip, username, timestamp, success)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username, ip, timestamp, success ? 1 : 0);
}

// get all login attempts since a certain date
function get_recent_login_attempts(ip, since_timestamp) {
  const stmt = db.prepare(`
    SELECT *
    FROM login_attempts
    WHERE ip = ?
      AND timestamp >= ?
    ORDER BY timestamp DESC
  `);
  return stmt.all(ip, since_timestamp);
}

// update the user at id with +1 failed attempt
function increment_failed_attempts(user_id) {
  db.prepare(`
    UPDATE users
    SET failed_attempts = failed_attempts + 1
    WHERE id = ?
  `).run(user_id);
}

// update user at id with 0 failed attempts
function reset_failed_attempts(user_id) {
  db.prepare(`
    UPDATE users
    SET failed_attempts = 0,
        locked_until = NULL
    WHERE id = ?
  `).run(user_id);
}

// locks an account until provided date
function lock_account(user_id, locked_until) {
  db.prepare(`
    UPDATE users
    SET locked_until = ?
    WHERE id = ?
  `).run(locked_until, user_id);
}

// delete all sessions for user, used to log people out
function delete_sessions_for_user(username) {
  const stmt = db.prepare(`
    DELETE FROM sessions WHERE username = ?
  `);
  stmt.run(username);
}

// update the display name of a user
function update_display_name(user_id, display_name) {
  const stmt = db.prepare(`
    UPDATE users SET display_name = ? WHERE id = ?
  `);
  stmt.run(display_name, user_id);
}

// update the password of a user
function update_password(user_id, password_hash) {
  const stmt = db.prepare(`
    UPDATE users SET password_hash = ? WHERE id = ?
  `);
  stmt.run(password_hash, user_id);
}

// gets the profile customization for a user id
function get_profile_customization(user_id) {
  const stmt = db.prepare(`
    SELECT profile_customization FROM users WHERE id = ?
  `);
  const row = stmt.get(user_id);

  if (!row || !row.profile_customization) {
    return {};
  }

  try {
    return JSON.parse(row.profile_customization);
  } catch {
    return {};
  }
}

// creates a new chat message, NOT a comment
function create_chat_message(author_id, body, timestamp) {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (author_id, body, timestamp)
    VALUES (?, ?, ?)
  `);
  stmt.run(author_id, body, timestamp);
}

// gets the chat history, call with a high limit like 100
function get_chat_history(limit, offset) {
  const stmt = db.prepare(`
    SELECT
      c.id,
      c.body,
      c.timestamp,
      u.display_name,
      u.profile_customization
    FROM chat_messages c
    JOIN users u ON u.id = c.author_id
    ORDER BY c.id DESC
    LIMIT ? OFFSET ?
  `);

  return stmt.all(limit, offset).reverse();
}

module.exports = {
  // users
  create_user,
  get_user_by_id,
  get_user_by_username,
  get_profile_customization,
  update_profile_customization,
  lock_account,
  delete_sessions_for_user,
  update_display_name,
  update_password,

  // sessions
  create_session,
  get_session,
  delete_session,
  delete_expired_sessions,

  // comments
  create_comment,
  get_comments,
  delete_comment,
  get_comment_count,

  // login attempts
  record_login_attempt,
  get_recent_login_attempts,
  increment_failed_attempts,
  reset_failed_attempts,

  // chat messages
  create_chat_message,
  get_chat_history
};
