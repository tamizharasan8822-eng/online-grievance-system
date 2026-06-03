const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// நாம் உருவாக்கிய 'uploads' ஃபோல்டரை வெளியில் இருந்து பார்க்க அனுமதி அளிப்பது
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 💻 MySQL டேட்டாபேஸ் கனெக்ஷன்
const db = mysql.createConnection({
host: 'mysql-36052920-tamizharasan8822-28a1.h.aivencloud.com',    port: 22638,
    user: 'avnadmin',
    password:'AVNS_9f4t7VAzHlXMpQ4uSTn',
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('MySQL Connected Successfully...');
});

// 📸 Multer Setup - போட்டோவை 'uploads' போல்டர்ல சேவ் பண்றதுக்கு
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. 📝 புதிய புகாரைப் பதிவு செய்யும் API
app.post('/api/complaint', upload.single('photo'), (req, res) => {
    const { name, details } = req.body;
    
    // போட்டோ இருந்தா அதோட லிங்க், இல்லனா வெற்று உரை
    const photoInfo = req.file ? ` [Photo: /uploads/${req.file.filename}]` : ''; 
    
    // புதிய கம்ப்ளைன்ட் ஐடி (REG + 6 எண்கள்)
    const complaintId = 'REG' + Math.floor(100000 + Math.random() * 900000);

    // விவரத்தையும் போட்டோ பெயரையும் ஒன்றாக இணைக்கிறோம்
    const finalDetails = details + photoInfo;

    const query = "INSERT INTO complaints (id, name, details, status) VALUES (?, ?, ?, 'Pending')";
    
    db.query(query, [complaintId, name, finalDetails], (err, result) => {
        if (err) {
            console.error("Database Error: ", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: complaintId });
    });
});

// 2. 🔍 புகாரின் நிலையைத் தேடும் API
app.get('/api/complaint/:id', (req, res) => {
    const complaintId = req.params.id;
    const query = "SELECT * FROM complaints WHERE id = ?";

    db.query(query, [complaintId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length > 0) {
            res.json({ found: true, data: result[0] });
        } else {
            res.json({ found: false });
        }
    });
});
// அட்மின் பேனல் HTML ஃபைலை நேரடியாக ஓபன் செய்ய
app.get('/admin.html', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});
// 📑 1. அட்மின் பேனலுக்காக எல்லா புகார்களையும் தேதி வாரியாக எடுக்கும் API
app.get('/api/admin/complaints', (req, res) => {
    const sql = 'SELECT * FROM complaints ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "டேட்டாபேஸ் எர்ரர்!" });
        }
        res.json(results);
    });
});

// 🔄 2. அட்மின் புகாரின் நிலையை (Status) மாற்றுவதற்கான API
app.put('/api/admin/complaints/:id/status', (req, res) => {
    const complaintId = req.params.id;
    const { status } = req.body;
    
    const sql = 'UPDATE complaints SET status = ? WHERE id = ?';
    db.query(sql, [status, complaintId], (err, result) => {
        if (err) {
            console.error("Status update error:", err);
            return res.status(500).json({ error: "ஸ்டேட்டஸை மாற்ற முடியவில்லைண்ணா!" });
        }
        res.json({ success: true, message: "ஸ்டேட்டஸ் வெற்றிகரமாக மாற்றப்பட்டது!" });
    });
});
// புகார்களை மாசம் மற்றும் வருஷ வாரியா எடுத்து PDF டேட்டாவாக மாற்றும் API
app.get('/api/admin/complaints/report', (req, res) => {
    // DATE_FORMAT மூலம் புகார்களை வருஷம் மற்றும் மாத வாரியாக (உதாரணமாக: June 2026) பிரித்து எடுக்கிறோம்
    const sql = `
        SELECT 
            id, name, email, details, status,
            DATE_FORMAT(created_at, '%M %Y') AS month_year,
            DATE_FORMAT(created_at, '%d/%m/%Y') AS formatted_date
        FROM complaints 
        ORDER BY created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Report Fetch Error:", err);
            return res.status(500).json({ error: "டேட்டாபேஸ் அறிக்கை எடுப்பதில் தோல்வி!" });
        }
        res.json(results);
    });
});
// 🚀 சர்வர் போர்ட்
// அட்மின் புகாரின் நிலையை (Status) மாற்றும் API
app.put('/api/admin/complaints/:id/status', (req, res) => {
    const complaintId = req.params.id;
    const { status } = req.body;

    const sql = 'UPDATE complaints SET status = ? WHERE id = ?';
    db.query(sql, [status, complaintId], (err, result) => {
        if (err) {
            console.error("Status Update Error:", err);
            return res.status(500).json({ error: "டேட்டாபேஸ் அப்டேட் செய்வதில் தோல்வி!" });
        }
        res.json({ success: true, message: "ஸ்டேட்டஸ் வெற்றிகரமாக மாற்றப்பட்டது!" });
    });
});
app.listen(3000, () => {
    console.log('Server running perfectly on port 3000');
});