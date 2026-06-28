const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// HTML ஃபைல்களை சர்வர் எடுத்துக்கொள்ள
app.use(express.static(path.join(__dirname, './')));

// 🌍 உங்க Aiven Online DB விபரங்கள்
const db = mysql.createConnection({
    host: 'mysql-36052920-tamizharasan8822-28a1.h.aivencloud.com',
    port: 22638,
    user: 'avnadmin',
    password: 'AVNS_0I2TBL2HSueOubXuyCH',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

db.connect(err => {
    if (err) { console.error('Database connection failed: ' + err.stack); return; }
    console.log('Connected to Aiven MySQL Online Database.');
});

// 🏠 மெயின் லிங்க் (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 📥 புது புகாரைச் சேமிக்க API
app.post('/api/complaints', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO amc_complaints SET ?', data, (err, result) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send({ message: 'Ticket saved successfully!' });
    });
});

// 📤 அனைத்து புகார்களையும் எடுக்க API
app.get('/api/complaints', (req, res) => {
    db.query('SELECT * FROM amc_complaints ORDER BY date DESC', (err, results) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send(results);
    });
});

// 🔄 ஸ்டேட்டஸ் மற்றும் அது மாறிய நேரத்தை அப்டேட் செய்ய API
app.put('/api/complaints/:id', (req, res) => {
    const { status, action_taken } = req.body;
    
    // இந்திய நேர வடிவமைப்பு (உதாரணம்: 28-06-2026 01:15:20 PM)
    const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const currentIndianTime = new Date().toLocaleString('en-IN', options).replace(/\//g, '-');

    db.query(
        'UPDATE amc_complaints SET status = ?, action_taken = ?, status_updated_at = ? WHERE id = ?',
        [status, action_taken, currentIndianTime, req.params.id],
        (err, result) => {
            if (err) { console.error(err); return res.status(500).send(err); }
            res.send({ message: 'Ticket updated successfully!', updatedAt: currentIndianTime });
        }
    );
});

// 🧹 ஆன்லைன் டேட்டாபேஸை கிளியர் செய்ய API
app.delete('/api/complaints/clear-all', (req, res) => {
    db.query('TRUNCATE TABLE amc_complaints', (err, result) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send({ message: 'All tickets cleared successfully!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
