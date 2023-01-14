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

const urlsForUser = function(userID) {
  let matchingURL = {};
  for (let key in urlDatabase) {
    if (userID === urlDatabase[key].userId) {
      matchingURL[key] = urlDatabase[key].longURL
    }
  }
  return matchingURL;
}

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


//// ROUTES ////
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

///Creating URLS Page///
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.cookies["userId"]),
    user: users[req.cookies["userId"]]
  };
  if (req.cookies.userId) {
    console.log('------->', req.cookies["userId"])
    console.log('DB', urlDatabase)
    return res.render("urls_index", templateVars);
  }
  res.redirect("/login"); //Redirects to login page
});

// Render Login Page
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies["userId"]]};
  if (req.cookies.userId) {
    return res.redirect("/urls")
  }

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

  res.cookie("userId", foundUser.id);
  res.redirect("/urls");
});

/// POST URLS ///
app.post("/urls", (req, res) => {
  if (!req.cookies.userId) {
    return res.send("<h1> Sorry, you must be logged in to use this feature! </h1>")
  }
  const id = randomGenString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userId: req.cookies.userId 
  }
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
  const urlExists = urlsForUser(req.cookies.userId)

  if (!req.cookies.userId) {
    return res.status(400).send("Need to be logged in")
  }

  // [array of short urls user own]
  const shortURLs = Object.keys(urlExists)
  // if requested short url is not in the shortURLs array
  if (!shortURLs.includes(req.params.id)) {
    return res.send("short URL does not exist")
  }

  // if user owns the requested URL

  //Happy Path
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["userId"]]
  };
  res.render("urls_show", templateVars);
});

// Redirecting to longURL after shorten
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("short URL does not exist")
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// UPDATE
app.post("/urls/:id/edit", (req, res) => {
  const urlExists = urlsForUser(req.cookies.userId)

  if (!req.cookies.userId) {
    return res.status(400).send("Need to be logged in")
  }
 
  // if requested short url is not in the shortURLs array
  if (!urlDatabase[req.params.id]) {
    return res.send("short URL does not exist")
  }

  if (urlDatabase[req.params.id].userId !== req.cookies.userId) {
    return res.send("You need to own this url to edit it")
  }

  const id = req.params.id;
  const newURL = req.body.newID;
  urlDatabase[id].longURL = newURL;
  res.redirect(`/urls/${id}`);
});

// DELETE
app.post("/urls/:id/delete", (req, res)=> {
  if (!req.cookies.userId) {
    return res.status(400).send("Need to be logged in")
  }
  // if requested short url is not in the shortURLs array
  if (!urlDatabase[req.params.id]) {
    return res.send("short URL does not exist")
  }

  if (urlDatabase[req.params.id].userId !== req.cookies.userId) {
    return res.send("You need to own this url to edit it")
  }
  
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
