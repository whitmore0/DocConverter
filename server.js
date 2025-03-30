const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const DocumentConverter = require('./converters');

const app = express();
const converter = new DocumentConverter();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Serve static files
app.use(express.static(__dirname));

// Handle file upload
app.post('/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const fileInfo = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
    }));

    res.json({
        message: 'Files uploaded successfully',
        files: fileInfo
    });
});

// Convert endpoint
app.post('/convert', express.json(), async (req, res) => {
    try {
        const { filename, targetFormat } = req.body;

        if (!filename || !targetFormat) {
            return res.status(400).json({
                error: 'Missing filename or target format'
            });
        }

        const inputPath = path.join(uploadsDir, filename);

        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({
                error: 'File not found'
            });
        }

        const result = await converter.convert(inputPath, targetFormat);

        if (result.success) {
            const outputFilename = path.basename(result.outputPath);
            res.json({
                success: true,
                message: result.message,
                outputFile: outputFilename
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error during conversion'
        });
    }
});

// Download converted file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'outputs', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'DocConverter server is running' });
});

app.listen(PORT, () => {
    console.log(`DocConverter server running on port ${PORT}`);
});