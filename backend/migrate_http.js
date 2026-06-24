const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const DB_FILE = path.join(__dirname, 'data', 'reports.db');
const db = new sqlite3.Database(DB_FILE);

const CLOUD_RUN_URL = 'https://metal-weekly-report-1134988787.asia-northeast3.run.app/api/reports';

console.log('Starting HTTP migration from SQLite to Cloud Run...');

function postData(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const urlObj = new URL(CLOUD_RUN_URL);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          reject(`Status: ${res.statusCode}, Body: ${responseBody}`);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

db.all('SELECT * FROM reports', [], async (err, rows) => {
  if (err) {
    console.error('Error reading from SQLite:', err);
    return;
  }
  
  console.log(`Found ${rows.length} reports in local database.`);
  
  let successCount = 0;
  for (const row of rows) {
    try {
      await postData({
        date: row.date || '',
        name: row.name || '',
        thisWeekTask: row.thisWeekTask || '',
        nextWeekTask: row.nextWeekTask || '',
        project: row.project || '',
        printer: row.printer || '',
        keywords: row.keywords || '',
        imagePath: row.imagePath || ''
      });
      successCount++;
      console.log(`Migrated ${successCount} / ${rows.length}: ${row.name} - ${row.date}`);
    } catch (e) {
      console.error(`Error migrating row ${row.id}:`, e);
    }
  }
  
  console.log(`\nMigration completed! ${successCount} records successfully pushed to Cloud Run.`);
  process.exit(0);
});
