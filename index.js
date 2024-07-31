const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('MySQL Connected...');
});

app.post('/register', async (req, res) => {
    const { username, phone, email, gender, birthdate, password } = req.body;

    if (!username || !phone || !email || !gender || !birthdate || !password) {
        return res.status(400).send('All fields are required');
    }

    try {
        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO user (username, phone, email, gender, birthdate, password) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [username, phone, email, gender, birthdate, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send(err);
            }
            res.send('User registered');
        });
    } catch (error) {
        console.error('Error in /register route:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/users', (req, res) => {
    const sql = 'SELECT id, username, phone, email, gender, birthdate, created_at FROM user';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
