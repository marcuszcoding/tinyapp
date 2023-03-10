const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

const { findUserByEmail } = require("./helpers"); // requiring find user by email function

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userId: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "pass",
  },
};

const urlsForUser = function(userID) {
  let matchingURL = {};
  for (let key in urlDatabase) {
    if (userID === urlDatabase[key].userId) {
      matchingURL[key] = urlDatabase[key].longURL;
    }
  }
  return matchingURL;
};

const randomGenString = (length = 6) => Math.random().toString(36).substr(2, length);
//Randomly generated string with numbers with length set to 6

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true })); //body parser
app.use(cookieSession({
  name: 'session',
  keys: ['secret'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

////////////////
//// ROUTES ////
////////////////

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/// CREATE URLS PAGE ///
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session["userId"]),
    user: users[req.session["userId"]]
  };
  if (req.session.userId) {
    return res.render("urls_index", templateVars);
  }
  res.redirect("/login"); //Redirects to login page if not logged in
});

/// RENDER LOGIN ///
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session["userId"]]};
  if (req.session.userId) {
    return res.redirect("/urls");
  }

  res.render("urls_login", templateVars);
});

/// RENDER REGISTER ///
app.get("/register", (req, res) => {
  const templateVars = { user: null };

  if (req.session.userId) {
    return res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

/// POST REGISTER ///
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
  let newPassword = bcrypt.hashSync(req.body.password, 10);

  const user = {
    id,
    email,
    password: newPassword
  };

  users[id] = user;

  req.session["userId"] = user.id;
  res.redirect("/urls");
});

/// POST LOGIN ///
app.post("/login", (req, res) => {
  const { email, password } = req.body; // destructure of req.body.email and req.body.password
  const foundUser = findUserByEmail(email, users);
  // If no user email is found
  if (!foundUser) {
    return res.status(403).send("<h1> Error! Email was not found! </h1>");
  } // If user is found but password does not match
  if (bcrypt.compareSync(password, foundUser.password)) {
    req.session.userId = foundUser.id;
    res.redirect("/urls");
    return;
  }
  return res.status(403).send("<h1> Error! Password is not correct! </h1>");
});

/// POST URLS ///
app.post("/urls", (req, res) => {
  if (!req.session.userId) {
    return res.send("<h1> Sorry, you must be logged in to use this feature! </h1>");
  }
  const id = randomGenString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userId: req.session.userId
  };
  res.redirect(`/urls/${id}`);
});

/// RENDER NEW URLS ///
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session["userId"]]
  };
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const urlExists = urlsForUser(req.session.userId);

  if (!req.session.userId) {
    return res.status(401).send("Please Login or Register!");
  }

  // [array of short urls user own]
  const shortURLs = Object.keys(urlExists);
  // If requested short url is not in the shortURLs array
  if (!shortURLs.includes(req.params.id)) {
    return res.send("short URL does not exist");
  }

  // If user owns the requested URL
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session["userId"]]
  };
  res.render("urls_show", templateVars);
});

// Redirecting to longURL after shorten
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("short URL does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

/// UPDATE ///
app.post("/urls/:id/edit", (req, res) => {

  if (!req.session.userId) {
    return res.status(401).send("Need to be logged in");
  }
 
  // if requested short url is not in the shortURLs array
  if (!urlDatabase[req.params.id]) {
    return res.send("short URL does not exist");
  }

  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.send("You need to own this url to edit it");
  }

  const id = req.params.id;
  const newURL = req.body.newID;
  urlDatabase[id].longURL = newURL;
  res.redirect(`/urls/${id}`);
});

/// DELETE ///
app.post("/urls/:id/delete", (req, res)=> {
  if (!req.session.userId) {
    return res.status(401).send("You need to be logged in!");
  }
  // if requested short url is not in the shortURLs array
  if (!urlDatabase[req.params.id]) {
    return res.send("short URL does not exist");
  }

  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.send("You need to own this url to edit it");
  }
  
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

/// LOGOUT //
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/login");
});

/// LISTEN ///
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});