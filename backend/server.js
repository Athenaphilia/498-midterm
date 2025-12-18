// server.js
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const path = require('path');
const { requestLogger } = require('./modules/logging');
const db = require('./modules/database');
const page_routes = require('./routes/page_routes');
const auth_routes = require('./routes/auth_routes');
const comment_routes = require('./routes/comment_routes');
const profile_routes = require('./routes/profile_routes');

const app = express();

app.set('trust proxy', true);

// view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(session({
  secret: 'this-is-very-unsafe-plz-change',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(requestLogger);

const PORT = process.env.PORT || 3000;

app.use('/', page_routes);
app.use('/', auth_routes);
app.use('/', comment_routes);
app.use('/', profile_routes);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  db.close()
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
