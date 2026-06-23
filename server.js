const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2'); // 🗄️ ஆன்லைன் MySQL கனெக்ட் செய்ய புதிய பேக்கேஜ்

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rootDir = path.resolve(process.cwd());
app.use(express.static(rootDir));

// 🌐 Aiven-ல் இருந்து நீங்க எடுத்த மெயின் Service URI லிங்க் அண்ணே!
const connectionString = "mysql://avnadmin:AVNS_0I2TBL2HSueOubXuyCH@mysql-36052920-tamizharasan8822-28a1.h.aivencloud.com:22638/defaultdb?ssl-mode=REQUIRED"; 

const db = mysql.createConnection(connectionString);

db.connect((err) => {
    if (err) {
        console.error('❌ ஆன்லைன் கிளவுட் டேட்டாபேஸ் கனெக்ட் ஆகல அண்ணே!: ' + err.stack);
        return;
    }
    console.log('✅ Aiven கிளவுட் MySQL டேட்டாபேஸ் பக்காவா கனெக்ட் ஆயிடுச்சு அண்ணே! 🚀');
    
    // 🛠️ ஆன்லைன் டேட்டாபேஸ்ல complaints டேபிள் இல்லைனா அதைத் தானாகவே உருவாக்கும் கோடு
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS complaints (
            id INT PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            status VARCHAR(50) DEFAULT 'Pending'
        );
    `;
    db.query(createTableQuery, (err, result) => {
        if (err) console.log("டேபிள் உருவாக்குவதில் சிக்கல்:", err);
        else console.log("📋 Complaints டேபிள் ஆன்லைனில் தயார் அண்ணே!");
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// 1. புதிய புகாரைப் பதிவு செய்ய (POST) - இனி ஆன்லைன் கிளவுட்ல சேவ் ஆகும்!
app.post('/api/complaint', (req, res) => {
    const { userName, hardwareComponent, complaintDetails } = req.body;
    const ticketId = Math.floor(100000 + Math.random() * 900000); 

    const newComplaint = {
        id: ticketId,
        title: userName || 'Anonymous',
        description: `${hardwareComponent || 'General'} - ${complaintDetails || 'No details'}`,
        status: 'Pending'
    };

    const query = 'INSERT INTO complaints SET ?';
    db.query(query, newComplaint, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database Error" });
        }
        console.log(`✅ ஆன்லைனில் புதிய புகார் பதிவானது! ID: ${ticketId}`);
        res.json({ success: true, id: ticketId });
    });
});

// 2. ஒரு குறிப்பிட்ட புகாரின் முழு விவரத்தையும் எடுக்க (GET by ID - Tracking)
app.get('/api/complaint/:id', (req, res) => {
    const complaintId = parseInt(req.params.id);
    
    db.query('SELECT * FROM complaints WHERE id = ?', [complaintId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ success: false, message: "Not Found" });
        }
    });
});

// 3. அட்மின் போர்ட்டலுக்காக அனைத்து புகார்களையும் எடுக்க (GET - All)
app.get('/api/all-complaints', (req, res) => {
    db.query('SELECT * FROM complaints ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results); // ஆன்லைன்ல இருக்குற எல்லா கம்ப்ளெய்ன்ட்டுகளையும் அட்மின் பேனலுக்கு அனுப்பும்
    });
});

// 4. அட்மின் போர்ட்டலில் இருந்து ஸ்டேட்டஸை அப்டேட் செய்ய (PUT)
app.put('/api/complaint/:id', (req, res) => {
    const complaintId = parseInt(req.params.id);
    const { status } = req.body;
    
    db.query('UPDATE complaints SET status = ? WHERE id = ?', [status, complaintId], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        console.log(`🔄 Ticket #${complaintId} Status Updated to: ${status}`);
        res.json({ success: true });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 சர்வர் ஆன்லைன் போர்ட் ${PORT}-ல ரெடி அண்ணே! http://localhost:${PORT}`);
});
