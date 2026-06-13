const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL கனெக்ஷன்
const db = mysql.createConnection(process.env.DATABASE_URL);

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('MySQL Connected Successfully...');
});

// 1. புகாரைப் பதிவு செய்யும் API (POST)
app.post('/api/complaint', (req, res) => {
    const { name, details } = req.body;
    
    // 6 இலக்க ரேண்டம் டிக்கெட் ஐடி
    const ticketId = Math.floor(100000 + Math.random() * 900000); 

    // உங்க டேட்டாபேஸ்ல இருக்குற அசல் காலம் பெயர்கள்: id, title, description, status
    // 'name'-ஐ 'title' ஆகவும், 'details'-ஐ 'description' ஆகவும் அனுப்புகிறோம்!
    const query = "INSERT INTO complaint (id, title, description, status) VALUES (?, ?, ?, 'Pending')";
    
    db.query(query, [ticketId, name, details], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: ticketId });
    });
});

// 2. புகாரின் நிலையைத் தேடும் API (GET)
app.get('/api/complaint/:id', (req, res) => {
    const { id } = req.params;
    
    // டேட்டாபேஸ்ல இருந்து துல்லியமாக விபரங்களை எடுக்கும் குயரி
    const query = "SELECT id, title, description, status FROM complaint WHERE id = ?";
    
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json(results);
    });
});

// சர்வர் போர்ட்
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running perfectly on port ${PORT}`);
});
