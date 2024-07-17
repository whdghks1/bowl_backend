const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Load secret.json file
const secrets = JSON.parse(fs.readFileSync('secret.json', 'utf8'));

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: secrets.host,
    user: secrets.user,
    password: secrets.password,
    database: secrets.database
});

db.connect(err => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const sql = 'INSERT INTO user (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send('User registered');
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
