const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const randomGenString = (length = 6) => Math.random().toString(36).substr(2, length);
//randomly generated string with numbers with length set to 6 
app.use(express.urlencoded({ extended: true }));

// READ (ALL)
// READ (ONE)
// CREATE 
// UPDATE
// DELETE

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// READ (All)
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// CREATE (creating via post)
app.post("/urls", (req, res) => {
  const id = randomGenString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// READ (ONE)
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});