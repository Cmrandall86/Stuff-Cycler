const express = require("express");
const db = require("./db");

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
  {
    groupName: "Test",
    id: "3",
    friends: [{ firstName: "Evan", lastName: "Jenkies" }],
  },
];

const posts = [
  { id: "1", title: "Book", description: "This is a book" },
  { id: "2", title: "Computer", description: "This is a computer" },
  { id: "3", title: "Desk", description: "This is a desk" },
];

app.get("/groups", (req, res) => {
  db.all("SELECT * from groups", (err, groups) => {
    if (err) {
      res.send(console.log(err));
    }
    res.send(JSON.stringify(groups));
  });
});

app.get("/groups/:id", (req, res) => {
  db.get(`SELECT * from groups WHERE id = ${req.params.id} ` , (err, group) => {
    if (err) {
      res.send(console.log(err))
    }
    res.send(group)
  })
});

//Foreign key constraint turned off because it wont work with it on. 
//need to refresh page after delete endpoint is hit to refresh the list without the deleted group
app.delete("/groups/:id/delete", (req, res) => {
  db.run(`DELETE FROM groups WHERE id = ${req.params.id}`, (err, group) => {
    if(err) {
      res.send(console.log(err))
    }
    res.send(console.log(req.body))
  })

  res.send(console.log(req.params));
});

app.post("/groups", (req, res) => {
  res.send(console.log(req.body))
})

app.get("/posts", (req, res) => {
  db.all("SELECT * FROM posts", (err, posts) => {
    if (err) {
      res.send(console.log(err))
    }
    res.send(JSON.stringify(posts))
  })
});

app.get("/posts/:id", (req, res) => {
  app.get(`SELECT * FROM posts WHERE id = ${req.params.id}` , (err, post) => {
    if (err) {
      res.send(console.log(err))
    }
    res.send(JSON.stringify(post))
  })

});

app.delete("/posts/:id/delete", (req, res) => {
  db.run(`DELETE FROM posts WHERE id = ${req.params.id}`, (err, post) => {
    if(err) {
      res.send(console.log(err))
    }
    res.send(console.log(req.body))
  })

  res.send(console.log(req.params));
});



app.listen(port, () => {
  console.log(`Server is up and running on ${port}`);
});
