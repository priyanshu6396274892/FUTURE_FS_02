const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); // Import JWT

const app = express();
const PORT = 5000;
const SECRET_KEY = "mySuperSecretKey"; // Ideally ye process.env.SECRET_KEY hona chahiye

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'leads.json');
const USERS_PATH = path.join(__dirname, 'users.json');

// --- Auth Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- Auth Routes ---
app.post('/api/signup', (req, res) => {
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    if (users.find(u => u.email === req.body.email)) return res.status(400).json({ error: "User exists" });
    users.push(req.body);
    fs.writeFileSync(USERS_PATH, JSON.stringify(users));
    res.status(201).json({ message: "Registered" });
});

app.post('/api/login', (req, res) => {
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    const user = users.find(u => u.email === req.body.email && u.password === req.body.password);
    if (!user) return res.status(401).json({ error: "Invalid" });
    
    // Token Generate karo
    const token = jwt.sign({ email: user.email }, SECRET_KEY);
    res.json({ token });
});

// --- Protected Lead Routes ---
app.get('/api/leads', authenticateToken, (req, res) => {
    res.json(JSON.parse(fs.readFileSync(DB_PATH, 'utf8')));
});

app.post('/api/leads', authenticateToken, (req, res) => {
    const leads = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const newLead = { ...req.body, id: Date.now().toString(), status: 'New', notes: [], dateTime: new Date().toLocaleDateString() };
    leads.push(newLead);
    fs.writeFileSync(DB_PATH, JSON.stringify(leads, null, 2));
    res.json(newLead);
});

// Note Route
app.post('/api/leads/:id/notes', authenticateToken, (req, res) => {
    let leads = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const lead = leads.find(l => l.id === req.params.id);
    if (lead) {
        if (!lead.notes) lead.notes = [];
        lead.notes.push(req.body.note);
        fs.writeFileSync(DB_PATH, JSON.stringify(leads, null, 2));
        res.json(lead);
    } else {
        res.status(404).json({ error: "Not found" });
    }
});

// Delete & Patch Routes should also have authenticateToken...

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));