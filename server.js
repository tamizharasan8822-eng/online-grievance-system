const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// HTML ஃபைல்களை சர்வர் தானாகவே எடுத்துக்கொள்ள இந்த வரி அவசியம் அண்ணே
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
    if (err) { 
        console.error('Database connection failed: ' + err.stack); 
        return; 
    }
    console.log('Connected to Aiven MySQL Online Database.');
});

// 🏠 மெயின் லிங்க் (/) ஓபன் பண்ணும்போது index.html-ஐக் காட்டும்
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 📥 புது புகாரைச் சேமிக்க API (POST)
app.post('/api/complaints', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO amc_complaints SET ?', data, (err, result) => {
        if (err) { 
            console.error(err); 
            return res.status(500).send(err); 
        }
        res.send({ message: 'Ticket saved successfully!' });
    });
});

// 📤 அனைத்து புகார்களையும் எடுக்க API (GET) - இதுதான் அட்மின் பேனலுக்கு போகும்
app.get('/api/complaints', (req, res) => {
    db.query('SELECT * FROM amc_complaints ORDER BY date DESC', (err, results) => {
        if (err) { 
            console.error(err); 
            return res.status(500).send(err); 
        }
        res.send(results);
    });
});

// 🔄 ஸ்டேட்டஸ் மற்றும் தீர்வு விபரத்தை அப்டேட் செய்ய API (PUT)
app.put('/api/complaints/:id', (req, res) => {
    const { status, action_taken } = req.body;
    db.query(
        'UPDATE amc_complaints SET status = ?, action_taken = ? WHERE id = ?',
        [status, action_taken, req.params.id],
        (err, result) => {
            if (err) { 
                console.error(err); 
                return res.status(500).send(err); 
            }
            res.send({ message: 'Ticket updated successfully!' });
        }
    );
});

// 🧹 ஆன்லைன் டேட்டாபேஸை முழுமையாக கிளியர் செய்ய API (DELETE)
app.delete('/api/complaints/clear-all', (req, res) => {
    db.query('TRUNCATE TABLE amc_complaints', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.send({ message: 'All tickets cleared successfully!' });
    });
});

// Render போர்ட் செட்டப்
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
