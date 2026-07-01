const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'grievances.json');

// Middleware to serve static files (like your HTML and uploaded photos)
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Configure Multer for processing file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// API Endpoint 1: Receive a new grievance submission
app.post('/api/grievances', upload.single('photo'), (req, res) => {
    try {
        const { title, description, lat, lng } = req.body;
        
        const newGrievance = {
            id: Date.now(),
            title,
            description,
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
            submittedAt: new Date().toISOString()
        };

        // Read existing grievances or start a fresh array
        let grievances = [];
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            grievances = JSON.parse(fileData || '[]');
        }

        // Add the new grievance and save back to the file
        grievances.push(newGrievance);
        fs.writeFileSync(DATA_FILE, JSON.stringify(grievances, null, 2));

        res.status(201).json({ success: true, message: 'Grievance recorded safely!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error saving submission.' });
    }
});

// API Endpoint 2: Fetch all grievances (for viewing submissions)
app.get('/api/grievances', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(fileData || '[]'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});