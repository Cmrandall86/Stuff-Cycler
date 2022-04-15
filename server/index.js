const express = require("express");
const app = express();
const port = 8000;

const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./db");
app.use(cors());
app.use(bodyParser.json());

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
  db.get(`SELECT * from groups WHERE id = ${req.params.id} `, (err, group) => {
    if (err) {
      res.send(console.log(err));
    }
    res.send(group);
  });
});

//Foreign key constraint turned off because it wont work with it on.
//need to refresh page after delete endpoint is hit to refresh the list without the deleted group
app.delete("/groups/:id/delete", (req, res) => {
  db.run(`DELETE FROM groups WHERE id = ${req.params.id}`, (err, group) => {
    if (err) {
      res.send(console.log(err));
    }
    res.send(console.log(req.body));
  });

  res.send(console.log(req.params));
});

app.post("/posts", (req, res) => {
  db.run(
    `INSERT INTO posts (title, description) VALUES (?,?)`,
    [req.body.title, req.body.description],
    function (err, post) {
      if (err) {
        res.send(console.log(err));
      }

      const stmt = db.prepare(
        `INSERT INTO post_groups (postID, groupID) VALUES (?,?)`
      );

      req.body.groups.forEach((groupID) => {
        stmt.run([this.lastID, groupID]);
      });

      stmt.finalize();

      res.send(console.log(this, err, post));
    }
  );


});

app.get("/posts", (req, res) => {
  db.all("SELECT * FROM posts", (err, posts) => {
    if (err) {
      res.send(console.log(err));
    }
    res.send(JSON.stringify(posts));
  });
});

//throw an error if post isnt found

app.get("/posts/:id", (req, res) => {
  console.log(req.params.id);
  db.get(`SELECT * FROM posts WHERE id = ${req.params.id}`, (err, post) => {
    db.all(
      `SELECT * FROM post_groups WHERE postID = ${req.params.id}`,
      (err, groupIDs) => {
        if (err) {
          res.send(console.log(err));
        }

        post.groups = groupIDs.map((row) => row.groupID);
        res.send(JSON.stringify(post));
      }
    );
    if (err) {
      res.send(console.log(err));
    }


  });
});

app.delete("/posts/:id/delete", (req, res) => {
  db.run(`DELETE FROM posts WHERE id = ${req.params.id}`, (err, post) => {
    if (err) {
      res.send(console.log(err));
    }
    res.send(console.log(req.body));
  });
  res.send(console.log(req.params));
});

app.listen(port, () => {
  console.log(`Server is up and running on ${port}`);
});
