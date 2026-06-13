const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // ஃபைல் பாதையை இணைக்க இது தேவை அண்ணே
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// அண்ணே, இதுதான் உங்க மெயின் index.html ஃபைலை வெப்சைட்டின் ஹோம் பேஜாக மாற்றும் மேஜிக் வரி!
app.use(express.static(path.join(__dirname, '../')));

// Render-ல் இருக்கும் 5 தனித்தனி வேரியபிள்களை நேரடியாக இணைக்கிறோம்
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('MySQL Connected Successfully to AWS/Aiven...');
});

// ஹோம் பேஜிற்குச் செல்லும்போது index.html ஃபைலைத் திறக்கச் சொல்கிறோம்
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 1. புகாரைப் பதிவு செய்யும் API (POST)
app.post('/api/complaint', (req, res) => {
    const { name, details } = req.body;
    const ticketId = Math.floor(100000 + Math.random() * 900000); 

    const query = "INSERT INTO complaint (id, title, description, status) VALUES (?, ?, ?, 'Pending')";
    
    db.query(query, [ticketId, name, details], (err, result) => {
        if (err) {
            console.error('Database Insertion Error:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: ticketId });
    });
});

// 2. புகாரின் நிலையைத் தேடும் API (GET)
app.get('/api/complaint/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT id, title, description, status FROM complaint WHERE id = ?";
    
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json(results);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running perfectly on port ${PORT}`);
});
