const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan");
const bcrypt = require("bcryptjs")
// const cookieSession = require("cookie-session")
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
};

// Function for finding user by their email
const findUserByEmail = function(email) {
  for (const uid in users) {
    const userObj = users[uid];
    if (userObj.email === email) {
      return userObj;
    }
  }
  return null;
};

const randomGenString = (length = 6) => Math.random().toString(36).substr(2, length);
//Randomly generated string with numbers with length set to 6

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true })); //body parser
// app.use(cookieSession({
//   name: 'session',
//   keys: ['secret'],

//   // Cookie Options
//   maxAge: 24 * 60 * 60 * 1000 // 24 hours
// }))
app.use(cookieParser()); // to create cookies, makes them available to req and res

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["userId"]]
  };
  if (req.cookies.userId) {
    return res.render("urls_index", templateVars);
  }
  res.redirect("/login");
});

// Render Login Page
app.get('/login', (req, res) => {
  const templateVars = { user: null };

  res.render("urls_login", templateVars);
});

// Render Register Page
app.get("/register", (req, res) => {
  const templateVars = { user: null };

  if (req.cookies.userId) {
    return res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

// POST REGISTER
app.post("/register", (req, res) => {
  const { email, password } = req.body; // destructure

  if (!email || !password) {
    return res.status(400).send("<h1> Error! Email and Password cannot be blank! </h1>");
  } //Error if when registering the email or password is empty

  // Checking for email below

  for (const uid in users) {
    const userObj = users[uid];
    if (userObj.email === email) {
      return res.status(400).send("<h1> Error! Email is already in use! </h1>");
    }
  }

  let id = randomGenString();
  const user = {
    id,
    email,
    password
  };

  users[id] = user;

  res.cookie("userId", id);
  res.redirect("/urls");
});

// POST LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body; // destructure of req.body.email and req.body.password
  const foundUser = findUserByEmail(email);
  // If no user email is found
  if (!foundUser) {
    return res.status(403).send("<h1> Error! Email was not found! </h1>");
  } //if user is found but password does not match
  if (foundUser.password !== password) {
    return res.status(403).send("<h1> Error! Password is not correct! </h1>");
  }

  let id = randomGenString();
  const user = {
    id,
    email,
    password
  };
  users[id] = user;
  res.cookie("userId", id);
  res.redirect("/urls");
});

/// POST URLS ///
app.post("/urls", (req, res) => {
  // if (!req.cookie.userId) {
  //   return res.send("<h1> Sorry, you must be logged in to use this feature! </h1>")
  // }
  const id = randomGenString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

/// NEW URLS ///
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userId"]]
  };
  if (!req.cookies.userId) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["userId"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// UPDATE
app.post("/urls/:id/rewrite", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.newID;
  urlDatabase[id] = newURL;
  res.redirect(`/urls/${id}`);
});

// DELETE
app.post("/urls/:id/delete", (req, res)=> {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

// LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/login");
});

// LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
