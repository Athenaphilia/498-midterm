const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const app = express();

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
let users = []; // user: {username, password}
let comments = []; // comment {author, text, createdAt}
let sessions = []; // session {username, sessionID, expires}


// gets the user if it exists, else guest user
// sesh is the req.session
function get_user(sesh) {
    let user = {
        name: "Guest",
        isLoggedIn: false,
        loginTime: null,
        visitCount: 0
    };
    if (sesh.isLoggedIn) {
        user = {
            username: sesh.username,
            isLoggedIn: true,
            loginTime: sesh.loginTime,
            visitCount: sesh.visitCount || 0,
        }
        sesh.visitCount = (sesh.visitCount || 0) + 1;
    }
    return user
}

// home page
app.get("/", (req, res) => {
    const user = get_user(req.session);
    res.render('home', {
        user: user
    })
})

// register page
app.get("/register", (req, res) => {
    const user = get_user(req.session);
    res.render('register', {
        user: user
    })
})

// finds the name in the users list, helper function
function find_name_in_list(name) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === name) {
            return i; // found name at index i
        }
    }
    return -1
}

// register form submission
app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (find_name_in_list(username) !== -1) {
        res.render("register", {
            error: 1
        }); // username is taken
    }
    else {
        // add the user to the user list
        users.push({username, password});
        console.log(username, password);
        console.log(users);
        res.redirect("/login");
    }
})

// login page
app.get("/login", (req, res) => {
    const user = get_user(req.session);
    res.render("login", {
        user: user
    });
})

// login form submission
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    let user_index = find_name_in_list(username);
    if (user_index === -1) {
        res.render("login", {
            no_username: 1
        }) // user not found
    }
    else if (users[user_index].password != password) {
        console.log("Password doesn't match");
        res.render("login", {
            wrong_password: 1
        }) // wrong password
    } else {
        // add the session object to our memory
        req.session.isLoggedIn = true;
        req.session.username = username;
        req.session.loginTime = new Date().toISOString();
        req.session.visitCount = 0;
        sessions.push({username: username, sessionId: req.sessionID, expires: req.session.expires})
        console.log(`User ${username} logged in at ${req.session.loginTime}`);
        res.redirect('/');
    }

})

// logout form submission
app.post("/logout", (req, res) => {
    const name = req.session.username;
    for (let index = 0; index < sessions.length; index++) {
        if (sessions[index].username === name) {
            sessions.splice(index, 1); // delete session from our memory
            break;
        }
        
    }
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
        }
    });
    console.log("Session removed");
    res.redirect('/');
})

// new comment page
app.get("/comment/new", (req, res) => {
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
        res.render("new-comment", {
        user: user
    });
    } else {
        // instructions weren't clear on whether to show an error message or redirect
        // so I chose to redirect. The HTML contains logic for an error message anyways.
        // Uncomment the following and comment the res.redirect(...) if you want the error instead
        // res.render("new-comment", {
        //  user: user,
        //  error: 1
        // })
        res.redirect("/login");
    }

})

// new comment form
app.post("/comment", (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.render("/comment/new", {
            error: 1
        }) // user is not logged in, so show error message
    }
    const user = {
        name: req.session.username,
        loginTime: req.session.loginTime,
        visitCount: req.session.visitCount || 0
    }
    // add comment to array
    const comment_text = req.body.comment_text;
    comments.push({
        author: user.name,
        text: comment_text,
        createdAt: new Date().toISOString()

    })
    console.log("Comment added");
    res.redirect("/comments");
})

// comments page
app.get("/comments", (req, res) => {
    const user = get_user(req.session);
    res.render("comments", {
        user: user,
        comments: comments
    });
})

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// to avoid error 137 on docker shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server closed. Exiting.');
        process.exit(0);
    })
});