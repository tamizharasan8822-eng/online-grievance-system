const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// டேட்டாபேஸ் கனெக்ஷன்
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'mysql-grievance.alwaysdata.net',
    user: process.env.DB_USER || 'grievance',
    password: process.env.DB_PASSWORD || 'Grievance@123',
    database: process.env.DB_NAME || 'grievance_system',
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: ", err);
    } else {
        console.log("Connected to AlwaysData MySQL Database!");
    }
});

// 1. 📝 புதிய புகாரைப் பதிவு செய்யும் API (POST METHOD)
app.post('/api/complaint', (req, res) => {
    const { name, details, photoInfo } = req.body;
    
    // புதிய கம்ப்ளைன்ட் ஐடி (6 எண்கள்)
    const complaintId = Math.floor(100000 + Math.random() * 900000);
    const finalDetails = details + (photoInfo ? " | Photo: " + photoInfo : "");

    const query = "INSERT INTO complaint (id, name, description, status, phone, address, ward, complaint_type) VALUES (?, ?, ?, 'Pending', '0000000000', 'N/A', '1', 'Hardware')";
    db.query(query, [complaintId, name, finalDetails], (err, result) => {
        if (err) {
            console.error("Database Error: ", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: complaintId });
    });
});

// 2. 🔍 புகாரின் நிலையைத் தேடும் API (GET METHOD)
app.get('/api/complaint/:id', (req, res) => {
    const ticketId = req.params.id;
    const query = "SELECT name, description, status FROM complaint WHERE id = ?";
    
    db.query(query, [ticketId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        res.json(result); 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
