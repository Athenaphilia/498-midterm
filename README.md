# 498 Final Project

## Corey Kaulenas

### Introduction

This is a very insecure, very simple forum with a cat theme.

This was developed for a midterm in a college class. The primary purpose was function.

### Installation and Run

Clone the repository `git clone https://github.com/Athenaphilia/498-midterm.git`.

Change directory `cd 498-midterm`

Change the port in `docker-compose.yml` to whatever you want

Create the `.env` file: `touch .env`

Fill it with a SESSION_SECRET=some_string and COOKIE_SECURE=boolean

Run `docker compose up --build -d`

To stop `docker compose down`

### Database Documentation

##### USERS

This table stores registered user accounts and authentication-related metadata.

- id: Integer primary key that uniquely identifies each user. Automatically incremented.
- username: Unique text identifier used for login. Cannot be null.
- password_hash: Hashed version of the user’s password. Cannot be null.
- display_name: Name shown publicly for the user. Cannot be null.
- profile_customization: Optional text field for storing user profile settings or preferences in JSON.
- locked_until: Optional timestamp indicating when a temporarily locked account will be unlocked.
- failed_attempts: Number of consecutive failed login attempts. Defaults to 0.

##### SESSIONS

This table tracks active login sessions.

- id: Text primary key representing the session identifier (for example, a secure random token).
- username: Username associated with the session. Cannot be null.
- expires: Timestamp indicating when the session expires.

##### COMMENTS

This table stores user-submitted comments.

- id: Integer primary key that uniquely identifies each comment. Automatically incremented.
- author: Integer referencing the id of the user who wrote the comment. May be null if anonymous comments are allowed.
- body: Text content of the comment. Cannot be null.
- timestamp: Timestamp indicating when the comment was created.
- Foreign key: author references users(id).

##### LOGIN_ATTEMPTS

This table records login attempts for auditing and security purposes.

- id: Integer primary key that uniquely identifies each login attempt. Automatically incremented.
- username: Username used in the login attempt. May be null if no username was provided.
- ip: IP address from which the login attempt was made. Cannot be null.
- timestamp: Timestamp indicating when the login attempt occurred.
- success: Integer flag indicating whether the attempt succeeded (typically 1 for success, 0 for failure).

##### CHAT_MESSAGES

This table stores messages sent in a chat system.

- id: Integer primary key that uniquely identifies each chat message. Automatically incremented.
- author_id: Integer identifying the user who sent the message. Cannot be null.
- body: Text content of the chat message. Cannot be null.
- timestamp: Timestamp indicating when the message was sent.
- Foreign key: author_id references users(id).

### Environment and Configuration

There are two environment variables:

- SESSION_SECRET: This is a secret key used for sessions. A long, random string
- COOKIE_SECURE: Whether the cookies are secure. False if http, True if https.

For configuration, the port and the database location can be changed.

### Nginx Proxy Manager

Nginx proxy manager is not included in this repo. But the docker compose file for it is below:

```yaml
services:
  nginx-proxy-manager:
    image: "jc21/nginx-proxy-manager:latest"
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "5001:81"
    volumes:
      - ./nginx/data:/data
      - ./nginx/letsencrypt:/etc/letsencrypt
```

Additionally, the configuration in the manager is shown in the image below, with a certificate verified using let's encrypt:

![Screenshot 2025-12-19 at 1 01 31 PM](https://github.com/user-attachments/assets/19d7b4e8-c165-4201-be2a-abb955ffb4e0)

### Security Features

Passwords are hashed using argon2, and are required to be at least 8 characters, have at least 1 number, 1 capital letter, 1 lowercase letter, and 1 special character. Additionally, https is used with secure cookies to make sure the sessions can't be transferred, and another person can't view the login requests. Also, a lockout system is in place, where after 4 failed attempts, and account will be locked for 15 minutes for every additional failed attempt. There are also systems to prevent XSS through javascript and html. The comments are cleaned before being stored in the database, so no raw js and html makes it into the comments. Finally, all database operations are designed to prevent SQL injection.

### Chat API

##### GET /chat

This endpoint serves the chat page UI.

- Authentication: Required. The user must be logged in (enforced by require_login).
- Description: Renders the chat interface for authenticated users.
- Behavior:

  - Retrieves the current user from the session using get_user.
  - Passes the user object to the chat view template.

- Response:

  - An HTML page rendered on the server.

- Errors:

  - If the user is not authenticated, access is denied by the require_login middleware.

##### GET /api/chat

This endpoint retrieves recent chat messages.

- Authentication: Required.
- Description: Returns a list of recent chat messages formatted for client-side display.
- Behavior:

  - Fetches up to 100 chat messages starting at offset 0 from the database.
  - Each message is enriched with user display information:

    - display name
    - name color derived from the user’s profile customization

  - Profile customization is parsed as JSON; if absent or invalid, defaults are used.

- Response:

  - JSON array of chat message objects.
  - Each object contains:

    - body: The message text.
    - timestamp: ISO timestamp of when the message was sent.
    - display_name: Public display name of the author.
    - name_color: Color associated with the author’s name (defaults to white if not set).

- Errors:

  - If the user is not authenticated, access is denied by the require_login middleware.

##### POST /api/chat

This endpoint sends a new chat message.

- Authentication: Required.
- Description: Allows an authenticated user to post a new chat message.
- Request body:

  - message: String containing the chat message text.

- Behavior:

  - Validates that the message exists and is not empty or whitespace.
  - Looks up the current user based on the session username.
  - Generates a timestamp in ISO 8601 format.
  - Stores the new chat message in the database.

- Response:

  - On success: JSON object `{ success: true }`.

- Errors:

  - 400 Bad Request if the message is missing or empty.
  - Authentication errors are handled by require_login.

### Known Limitations or Issues

- There is no email service, and so password recovery is not possible.
- Additionally, email is not being stored in the database, so it is not used anywhere in the app.
- All dates are raw ISO strings. I'm aware you can convert them to local time, but I left it as is for simplicity.
- Markdown is limited
- Sessions are not retained across server restarts.
- Comments are pulled from the offset, not page, so some weird page number stuff can happen if you edit the url, although this can never happen normally.
