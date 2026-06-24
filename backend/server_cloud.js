// Trigger IAM refresh
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/api/reports', async (req, res) => {
  try {
    const snapshot = await reportsCollection.orderBy('date', 'desc').get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (err) {
    console.error('Firestore GET error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const newReport = req.body;
    const id = Date.now().toString();
    
    await reportsCollection.doc(id).set({
      date: newReport.date,
      name: newReport.name,
      thisWeekTask: newReport.thisWeekTask || '',
      nextWeekTask: newReport.nextWeekTask || '',
      project: newReport.project || '',
      printer: newReport.printer || '',
      keywords: newReport.keywords || '',
      imagePath: newReport.imagePath || ''
    });

    res.json({ message: 'Success', id });
  } catch (err) {
    console.error('Firestore POST error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    await reportsCollection.doc(req.params.id).delete();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Firestore DELETE error:', err);
    res.status(500).json({ error: 'Database error' });
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
