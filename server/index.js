const express = require("express");
const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

const groups = [
  {
    groupName: "Family",
    id: "1",
    friends: [
      { firstName: "Christopher", lastName: "Randall" },
      { firstName: "Allie", lastName: "Randall" },
    ],
  },
  {
    groupName: "Friends",
    id: "2",
    friends: [{ firstName: "Evan", lastName: "Jenkies" }],
  },
];

const posts = [
  { id: "1", title: "Book", description: "This is a book" },
  { id: "2", title: "Computer", description: "This is a computer" },
];

app.get("/groups", (req, res) => {
  res.send(groups);
});

app.get("/groups/:id", (req, res) => {
  res.send(groups.find((group) => group.id === req.params.id));
});

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
