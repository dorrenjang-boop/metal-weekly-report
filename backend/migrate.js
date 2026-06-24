const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');

const DB_FILE = path.join(__dirname, 'data', 'reports.db');
const db = new sqlite3.Database(DB_FILE);
const firestore = new Firestore();
const reportsCollection = firestore.collection('reports');

console.log('Starting migration from SQLite to Firestore...');

db.all('SELECT * FROM reports', [], async (err, rows) => {
  if (err) {
    console.error('Error reading from SQLite:', err);
    return;
  }
  
  console.log(`Found ${rows.length} reports in local database.`);
  
  let migratedCount = 0;
  for (const row of rows) {
    try {
      await reportsCollection.doc(row.id).set({
        date: row.date,
        name: row.name,
        thisWeekTask: row.thisWeekTask || '',
        nextWeekTask: row.nextWeekTask || '',
        project: row.project || '',
        printer: row.printer || '',
        keywords: row.keywords || '',
        imagePath: row.imagePath || ''
      });
      migratedCount++;
      if (migratedCount % 10 === 0) {
        console.log(`Migrated ${migratedCount} / ${rows.length}...`);
      }
    } catch (e) {
      console.error(`Error migrating row ${row.id}:`, e);
    }
  }
  
  console.log(`Migration completed! ${migratedCount} records pushed to Firestore.`);
  process.exit(0);
});
