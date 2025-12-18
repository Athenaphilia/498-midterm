// modules/db_utils.js
const db = require('./database');

// users

function create_user(username, password_hash, display_name, profile_customization = null) {
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, profile_customization)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username, password_hash, display_name, profile_customization);
}

function get_user_by_id(user_id) {
  const stmt = db.prepare(`
    SELECT id, username, display_name, profile_customization
    FROM users
    WHERE id = ?
  `);
  return stmt.get(user_id);
}

function get_user_by_username(username) {
  const stmt = db.prepare(`
    SELECT *
    FROM users
    WHERE username = ?
  `);
  return stmt.get(username);
}

function update_profile_customization(user_id, profile_customization) {
  const stmt = db.prepare(`
    UPDATE users
    SET profile_customization = ?
    WHERE id = ?
  `);
  return stmt.run(JSON.stringify(profile_customization), user_id);
}

// sessions

function create_session(id, username, expires) {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, username, expires)
    VALUES (?, ?, ?)
  `);
  return stmt.run(id, username, expires);
}

function get_session(id) {
  const stmt = db.prepare(`
    SELECT *
    FROM sessions
    WHERE id = ?
  `);
  return stmt.get(id);
}

function delete_session(id) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE id = ?
  `);
  return stmt.run(id);
}

function delete_expired_sessions(now_iso) {
  const stmt = db.prepare(`
    DELETE FROM sessions
    WHERE expires < ?
  `);
  return stmt.run(now_iso);
}

// Comments

function create_comment(author_id, body, timestamp) {
  const stmt = db.prepare(`
    INSERT INTO comments (author, body, timestamp)
    VALUES (?, ?, ?)
  `);
  return stmt.run(author_id, body, timestamp);
}

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

function delete_comment(comment_id) {
  const stmt = db.prepare(`
    DELETE FROM comments
    WHERE id = ?
  `);
  return stmt.run(comment_id);
}

// login attempts

function record_login_attempt(username, ip, timestamp, success) {
  const stmt = db.prepare(`
    INSERT INTO login_attempts (ip, username, timestamp, success)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username, ip, timestamp, success ? 1 : 0);
}

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

function increment_failed_attempts(user_id) {
  db.prepare(`
    UPDATE users
    SET failed_attempts = failed_attempts + 1
    WHERE id = ?
  `).run(user_id);
}

function reset_failed_attempts(user_id) {
  db.prepare(`
    UPDATE users
    SET failed_attempts = 0,
        locked_until = NULL
    WHERE id = ?
  `).run(user_id);
}

function lock_account(user_id, locked_until) {
  db.prepare(`
    UPDATE users
    SET locked_until = ?
    WHERE id = ?
  `).run(locked_until, user_id);
}

function delete_sessions_for_user(username) {
  const stmt = db.prepare(`
    DELETE FROM sessions WHERE username = ?
  `);
  stmt.run(username);
}

function update_display_name(user_id, display_name) {
  const stmt = db.prepare(`
    UPDATE users SET display_name = ? WHERE id = ?
  `);
  stmt.run(display_name, user_id);
}

function update_password(user_id, password_hash) {
  const stmt = db.prepare(`
    UPDATE users SET password_hash = ? WHERE id = ?
  `);
  stmt.run(password_hash, user_id);
}

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

  // login attempts
  record_login_attempt,
  get_recent_login_attempts,
  increment_failed_attempts,
  reset_failed_attempts
};
