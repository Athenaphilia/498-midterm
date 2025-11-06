const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
    secret: "this-is-very-unsafe-plz-change-noooooo-dont-look-away-chaaange-meeeeee-please-i-beg-of-you-ill-do-anything-nooooooooo",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));


// Variables
let users = [{username: "user1", password: "pass1"}];
let comments = [];
let sessions = [];

app.get("/", (req, res) => {
    let user = {
        name: "Guest",
        isLoggedIn: false,
        loginTime: null,
        visitCount: 0
    };
    if (req.session.isLoggedIn) {
        user = {
            username: req.session.username,
            isLoggedIn: true,
            loginTime: req.session.loginTime,
            visitCount: req.session.visitCount || 0,
        }
        req.session.visitCount = (req.session.visitCount || 0) + 1;
    }
    res.render('home', {
        user: user
    })
})

app.get("/register", (req, res) => {
    res.render('register')
})

function find_name_in_list(name) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === name) {
            return i;
        }
    }
    return -1
}

app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (find_name_in_list(username) !== -1) {
        res.redirect("/register?error=1"); // add error capabilities
    }
    else {
        users.push({username, password});
        console.log(username, password);
        console.log(users);
        res.redirect("/");
    }
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    let user_index = find_name_in_list(username);
    console.log(user_index);
    if (user_index === -1) {
        console.log("Username not found");
        res.redirect("/login?error=1") // add error capabilities
    }
    else if (users[user_index].password != password) {
        console.log("Password doesn't match");
        res.redirect("/login?error=1") // add error capabilities
    } else {
        req.session.isLoggedIn = true;
        req.session.username = username;
        req.session.loginTime = new Date().toISOString();
        req.session.visitCount = 0;
        sessions.push({username: username, sessionId: req.sessionID, expires: req.session.expires})
        console.log(`User ${username} logged in at ${req.session.loginTime}`);
        res.redirect('/');
    }

})

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
        }
        res.redirect('/');
    });
})

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// to avoid error 137
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server closed. Exiting.');
        process.exit(0);
    })
});