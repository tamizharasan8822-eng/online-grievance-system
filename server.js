const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, './')));

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

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.post('/api/complaints', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO amc_complaints SET ?', data, (err, result) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send({ message: 'Ticket saved successfully!' });
    });
});

app.get('/api/complaints', (req, res) => {
    db.query('SELECT * FROM amc_complaints ORDER BY date DESC', (err, results) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send(results);
    });
});

// 🔄 புதிய மாற்றம்: டேட்டாபேஸ் எரர் வராமல் இருக்க மாற்று வழி!
app.put('/api/complaints/:id', (req, res) => {
    const { status, action_taken } = req.body;
    
    // இந்திய நேரத்தைக் கணக்கிடுதல்
    const options = { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const currentIndianTime = new Date().toLocaleString('en-IN', options).replace(/\//g, '-');

    // தீர்வுக்கு கீழே நேரத்தையும் சேர்த்து ஒரே பாக்ஸில் சேமிக்கிறோம் அண்ணே!
    let finalActionText = action_taken;
    if (status === "Resolved & Closed" && action_taken) {
        finalActionText = `${action_taken} \n(🕒 தீர்வு நேரம்: ${currentIndianTime})`;
    } else if (status === "In Progress") {
        finalActionText = `In Progress \n(🕒 மாற்றப்பட்ட நேரம்: ${currentIndianTime})`;
    } else {
        finalActionText = `Pending \n(🕒 மாற்றப்பட்ட நேரம்: ${currentIndianTime})`;
    }

    // பழைய காலங்களிலேயே (Columns) சேமிப்பதால் எந்த எரரும் வராது!
    db.query(
        'UPDATE amc_complaints SET status = ?, action_taken = ? WHERE id = ?',
        [status, finalActionText, req.params.id],
        (err, result) => {
            if (err) { console.error(err); return res.status(500).send(err); }
            res.send({ message: 'Ticket updated successfully!' });
        }
    );
});

app.delete('/api/complaints/clear-all', (req, res) => {
    db.query('TRUNCATE TABLE amc_complaints', (err, result) => {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send({ message: 'All tickets cleared successfully!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}...`));
