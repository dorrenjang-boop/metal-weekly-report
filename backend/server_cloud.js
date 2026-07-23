// Trigger IAM refresh
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased for Base64 image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// Google Cloud Firestore Configuration
// ==========================================
const firestore = new Firestore({ databaseId: 'metal-weekly-db' });
const reportsCollection = firestore.collection('reports');

// ==========================================
// Google Cloud Storage Configuration
// ==========================================
// Ensure GCS_BUCKET_NAME is set in Cloud Run environment variables
const bucketName = process.env.GCS_BUCKET_NAME || 'YOUR-BUCKET-NAME-HERE';
const storageClient = new Storage();
const bucket = storageClient.bucket(bucketName);

// Configure multer to use memory storage (file buffer) instead of local disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ==========================================
// Security Middleware (API Protection)
// ==========================================
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || 'metal2026';

app.use('/api', (req, res, next) => {
  // Allow CORS preflight requests
  if (req.method === 'OPTIONS') return next();
  
  const providedPassword = req.headers['x-team-password'];
  if (providedPassword !== TEAM_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Team Password' });
  }
  next();
});

// ==========================================
// API Routes
// ==========================================

// [NEW] Cloud Storage Upload Endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${req.file.originalname}`;
  const blob = bucket.file(`uploads/${uniqueName}`);
  
  const blobStream = blob.createWriteStream({
    resumable: false,
    contentType: req.file.mimetype,
  });

  blobStream.on('error', (err) => {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload to Cloud Storage' });
  });

  blobStream.on('finish', () => {
    // Generate public URL. (Note: Bucket must be configured to allow public reads, or use signed URLs)
    const publicUrl = `https://storage.googleapis.com/${bucketName}/uploads/${uniqueName}`;
    res.json({ imagePath: publicUrl });
  });

  blobStream.end(req.file.buffer);
});

// Local Mock for Reports to prevent Firestore crashes locally
let mockReports = [];

app.get('/api/reports', async (req, res) => {
  try {
    res.json(mockReports);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const newReport = req.body;
    const id = Date.now().toString();
    mockReports.push({ id, ...newReport });
    res.json({ message: 'Success', id });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    mockReports = mockReports.filter(r => r.id !== req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const index = mockReports.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
      mockReports[index] = { ...mockReports[index], ...req.body };
      res.json({ message: 'Updated successfully' });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ==========================================
// Phase 3 - Mock DB API Routes (Dynamic Parsing & OEE Auto)
// ==========================================
app.get('/api/metadata', async (req, res) => {
  try {
    const meta = await db.getMetadata();
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

app.get('/api/machines', async (req, res) => {
  try {
    const meta = await db.getMetadata();
    res.json(meta.machines);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

app.get('/api/builds', async (req, res) => {
  try {
    const builds = await db.getBuildLogs();
    res.json(builds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch build logs' });
  }
});

app.post('/api/builds', async (req, res) => {
  try {
    const newBuild = await db.addBuildLog(req.body);
    res.json({ message: 'Success', id: newBuild.id, data: newBuild });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add build log' });
  }
});

app.put('/api/builds/:id', async (req, res) => {
  try {
    const updated = await db.updateBuildLog(req.params.id, req.body);
    res.json({ message: 'Success', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update build log' });
  }
});

app.delete('/api/builds/:id', async (req, res) => {
  try {
    await db.deleteBuildLog(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete build log' });
  }
});

app.get('/api/oee', async (req, res) => {
  try {
    // OEE is now automatically calculated from build logs
    const oeeData = await db.getOEERecords();
    res.json(oeeData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automated OEE records' });
  }
});

// Serve frontend static files
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Use middleware for SPA fallback instead of app.get('*') which crashes Express 5
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// VERY IMPORTANT: Listen on port provided by Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cloud Server is running on Port ${PORT}`);
});
