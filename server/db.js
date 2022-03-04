const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(':memory:')

// db.get('PRAGMA foreign_keys = ON');

db.serialize(()=>{
    db.run('CREATE TABLE groups (id INTEGER PRIMARY KEY AUTOINCREMENT, groupName TEXT)')
    db.run('CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT)')
    db.run('CREATE TABLE friends (id INTEGER PRIMARY KEY AUTOINCREMENT, firstName TEXT, lastName TEXT)')
    db.run('CREATE TABLE posts_groups (postID INTEGER, groupID INTEGER, FOREIGN KEY(postID) REFERENCES posts(id), FOREIGN KEY(groupID) REFERENCES groups(id))')
    db.run('CREATE TABLE groups_friends (friendID INTEGER, groupID INTEGER, FOREIGN KEY(friendID) REFERENCES friends(id), FOREIGN KEY(groupID) REFERENCES groups(id))')

    
    db.run('INSERT INTO groups (groupName) VALUES ("Family")')
    db.run('INSERT INTO posts (title, description) VALUES ("Book", "This is a book")')
    db.run('INSERT INTO friends (firstName, lastName) VALUES ("Chris", "Randall"),("Allie" , "Randall")')
    db.run('INSERT INTO posts_groups (postID, groupID) VALUES (1,1)')
    db.run('INSERT INTO groups_friends (friendID, groupID) VALUES (2,1)')

    db.all('SELECT * from groups', (err, rows) =>{
        console.log(rows)
    })

    db.all('SELECT * FROM posts', (err, rows) =>{
        console.log(rows)
    })

    db.all('SELECT * FROM friends', (err, rows) =>{
        console.log(rows)
    })

    db.all('SELECT * FROM posts_groups', (err, rows) =>{
        console.log(rows)
    })

    db.all('SELECT * FROM groups_friends', (err, rows) =>{
        console.log(rows)
    })
})

// db.serialize(() => {
//   db.run('CREATE TABLE lorem (info TEXT)')
//   const stmt = db.prepare('INSERT INTO lorem VALUES (?)').run(group.id)

//   for (let i = 0; i < 10; i++) {
//     stmt.run(`Ipsum ${i} `)
//   }

//   stmt.finalize()

// //   db.each('SELECT rowid AS id, info FROM lorem', (err, row) => {
// //     console.log(`${row.id}: ${row.info}`)
// //   })

//   db.all('SELECT * FROM lorem', (err, rows) => {
//       console.log(rows)
//   } )
// })

module.exports = db