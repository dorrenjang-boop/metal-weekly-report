const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const CSV_FILE = path.join(DATA_DIR, 'metal_team_reports.csv');
const DB_FILE = path.join(DATA_DIR, 'reports.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Initialize SQLite DB
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  // Create table with imagePath
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      date TEXT,
      name TEXT,
      thisWeekTask TEXT,
      nextWeekTask TEXT,
      project TEXT,
      printer TEXT,
      keywords TEXT,
      imagePath TEXT
    )
  `);

  // Migrate CSV to DB if DB is empty and CSV or backup exists
  db.get("SELECT COUNT(*) as count FROM reports", (err, row) => {
    if (err) {
      console.error('Error checking DB count:', err);
      return;
    }
    const backupFile = CSV_FILE + '.backup';
    const sourceFile = fs.existsSync(CSV_FILE) ? CSV_FILE : (fs.existsSync(backupFile) ? backupFile : null);

    if (row.count === 0 && sourceFile) {
      console.log(`Migrating existing CSV data from ${sourceFile} to SQLite...`);
      const records = [];
      fs.createReadStream(sourceFile)
        .pipe(csvParser())
        .on('data', (data) => records.push(data))
        .on('end', () => {
          const stmt = db.prepare(`
            INSERT INTO reports (id, date, name, thisWeekTask, nextWeekTask, project, printer, keywords, imagePath)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          records.forEach(r => {
            const id = r.id || Date.now().toString() + Math.random().toString().slice(2, 6);
            // In CSV, old 'task' might exist, but newer has 'thisWeekTask'
            stmt.run(id, r.date, r.name, r.thisWeekTask || r.task || '', r.nextWeekTask || '', r.project || '', r.printer || '', r.keywords || '', r.imagePath || '');
          });
          stmt.finalize();
          console.log('Migration completed.');
          // Optionally, rename CSV to backup if it's not already
          if (sourceFile === CSV_FILE) {
            fs.renameSync(CSV_FILE, CSV_FILE + '.backup');
          }
        });
    }
  });
});

// ----------------------------------------------------
// REST APIs
// ----------------------------------------------------

// Upload Image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path relative to server root
  const imagePath = `/uploads/${req.file.filename}`;
  res.json({ imagePath });
});

// GET all reports with Pagination
app.get('/api/reports', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 0; // if 0, return all
  
  let query = 'SELECT * FROM reports ORDER BY date DESC';
  let params = [];

  if (limit > 0) {
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    // Return all records (Frontend will handle parsing)
    res.json(rows);
  });
});

// POST a new report
app.post('/api/reports', (req, res) => {
  const newReport = req.body;
  const id = Date.now().toString();
  
  const stmt = db.prepare(`
    INSERT INTO reports (id, date, name, thisWeekTask, nextWeekTask, project, printer, keywords, imagePath)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id, 
    newReport.date, 
    newReport.name, 
    newReport.thisWeekTask || '', 
    newReport.nextWeekTask || '', 
    newReport.project || '', 
    newReport.printer || '', 
    newReport.keywords || '', 
    newReport.imagePath || '',
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Success', id });
    }
  );
  stmt.finalize();
});

// DELETE a report
app.delete('/api/reports/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM reports WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Deleted successfully' });
  });
});

// UPDATE a report
app.put('/api/reports/:id', (req, res) => {
  const id = req.params.id;
  const { thisWeekTask, nextWeekTask } = req.body;
  
  const stmt = db.prepare('UPDATE reports SET thisWeekTask = ?, nextWeekTask = ? WHERE id = ?');
  stmt.run(thisWeekTask || '', nextWeekTask || '', id, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Updated successfully' });
  });
  stmt.finalize();
});

const mockDb = require('./db');

app.get('/api/metadata', async (req, res) => {
  try {
    const meta = await mockDb.getMetadata();
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

app.get('/api/machines', async (req, res) => {
  try {
    const meta = await mockDb.getMetadata();
    res.json(meta.machines);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

app.get('/api/builds', async (req, res) => {
  try {
    const builds = await mockDb.getBuildLogs();
    res.json(builds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch build logs' });
  }
});

app.post('/api/builds', async (req, res) => {
  try {
    const newBuild = await mockDb.addBuildLog(req.body);
    res.json({ message: 'Success', id: newBuild.id, data: newBuild });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add build log' });
  }
});

app.put('/api/builds/:id', async (req, res) => {
  try {
    const updated = await mockDb.updateBuildLog(req.params.id, req.body);
    res.json({ message: 'Success', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update build log' });
  }
});

app.delete('/api/builds/:id', async (req, res) => {
  try {
    await mockDb.deleteBuildLog(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete build log' });
  }
});

app.get('/api/oee', async (req, res) => {
  try {
    const oeeData = await mockDb.getOEERecords();
    res.json(oeeData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automated OEE records' });
  }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on http://0.0.0.0:${PORT}`);
});
