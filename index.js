const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    const sql = 'SELECT * FROM user WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send(err);
        }

        if (results.length === 0) {
            return res.status(400).send('Invalid email or password');
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid email or password');
        }

        // JWT 토큰 생성
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    });
});

// 인증 미들웨어
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).send('Access denied');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).send('Invalid token');
    }
};

// 보호된 경로 예시
app.get('/protected', authenticateJWT, (req, res) => {
    res.send('This is a protected route');
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
