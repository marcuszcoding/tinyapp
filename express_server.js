const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan")
const cookieParser = require("cookie-parser")

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const randomGenString = (length = 6) => Math.random().toString(36).substr(2, length);
//randomly generated string with numbers with length set to 6 
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true })); //body parser
app.use(cookieParser()); //to create cookies, makes them available to req and res

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// READ (All)
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {
  const usernameID = req.body.username
  console.log(req.body.username)
  res.cookie("username", usernameID)
  res.redirect(`/urls`)
})


// Get shows you the page
// app.get('/login', (req, res) => {
//   res.render("login")
// })

// app.get('/login', (req, res) => {
//   const preference = req.params.login
//   res.cookie("login", preference) // always has key value pairs, converts to string
//   res.redirect(`/urls`)
// })

// CREATE (creating via post)
app.post("/urls", (req, res) => {
  const id = randomGenString();
  // console.log(id)
  // console.log(urlDatabase)
  urlDatabase[id] = req.body.longURL;
  // console.log(urlDatabase)
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"]}
  res.render("urls_new", templateVars);
});

// READ (ONE)
app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL)
})

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
  res.redirect(`/urls`)
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls")
})

// LISTEN

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// READ (ALL)
// READ (ONE)
// CREATE 
// UPDATE
// DELETE