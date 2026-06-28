const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// உங்க Aiven Online DB விபரங்கள் நேரடியாக இணைக்கப்பட்டுள்ளது
const db = mysql.createConnection({
    host: 'mysql-36052920-tamizharasan8822-28a1.h.aivencloud.com',
    port: 22638,
    user: 'avnadmin',
    password: 'AVNS_0I2TBL2HSueOubXuyCH',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false } // Aiven SSL மோடிற்காக கட்டாயம் தேவை
});

db.connect(err => {
    if (err) { console.error('Database connection failed: ' + err.stack); return; }
    console.log('Connected to Aiven MySQL Online Database.');
});

// 📥 புது புகாரைச் சேமிக்க API
app.post('/api/complaints', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO amc_complaints SET ?', data, (err, result) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send({ message: 'Ticket saved successfully!' });
    });
});

// 📤 அனைத்து புகார்களையும் எடுக்க (Admin Panel)
app.get('/api/complaints', (req, res) => {
    db.query('SELECT * FROM amc_complaints ORDER BY date DESC', (err, results) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send(results);
    });
});

// 🔄 ஸ்டேட்டஸ் மற்றும் Action Taken அப்டேட் செய்ய
app.put('/api/complaints/:id', (req, res) => {
    const { status, action_taken } = req.body;
    db.query(
        'UPDATE amc_complaints SET status = ?, action_taken = ? WHERE id = ?',
        [status, action_taken, req.params.id],
        (err, result) => {
            if (err) { console.error(err); return res.status(500).send(err); }
            res.send({ message: 'Ticket updated successfully!' });
        }
    );
});

// Render-க்கு தேவையான போர்ட் செட்டப்
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
