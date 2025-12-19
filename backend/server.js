// server.js
const express = require('express');
const session = require('express-session');
const http = require('http');
const hbs = require('hbs');
const path = require('path');
const { Server } = require('socket.io')
const { requestLogger } = require('./modules/logging');
const db = require('./modules/database');
const page_routes = require('./routes/page_routes');
const auth_routes = require('./routes/auth_routes');
const comment_routes = require('./routes/comment_routes');
const profile_routes = require('./routes/profile_routes');
const chat_api_routes = require('./routes/chat_api_routes');

const db_utils = require('./modules/database_utils');

const app = express();
const io_server = http.createServer(app);
const io = new Server(io_server);

const session_middleware = session({
  secret: 'this-is-very-unsafe-plz-change',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
})

app.set('trust proxy', true);

// view engine
app.set('view engine', 'hbs');

hbs.registerHelper('gt', function (a, b) {
  return a > b;
});

app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session_middleware);

app.use(requestLogger);

const PORT = process.env.PORT || 3000;

app.use('/', page_routes);
app.use('/', auth_routes);
app.use('/', comment_routes);
app.use('/', profile_routes);
app.use('/', chat_api_routes);

io.engine.use(session_middleware);


io.on('connection', socket => {
  const req = socket.request;
  
  if (!req.session?.isLoggedIn) {
    return socket.disconnect();
  }
  
  const user = db_utils.get_user_by_username(req.session.username);
  const customization = JSON.parse(user.profile_customization || '{}');
  console.log(`User ${user.username} connected`);

  socket.on('chat_message', msg => {
    if (!msg || !msg.trim()) return;

    const timestamp = new Date().toISOString();

    db_utils.create_chat_message(user.id, msg.trim(), timestamp);

    io.emit('chat_message', {
      body: msg.trim(),
      timestamp,
      display_name: user.display_name,
      name_color: customization.name_color || '#ffffff'
    });
  });
});


const server = io_server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  db.close()
  io.close(() => {
    console.log('Socket.IO closed');

    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
