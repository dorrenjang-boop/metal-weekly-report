const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const sourceDir = path.join(__dirname, '../source');
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.xlsx'));

console.log('Files:', files);

files.forEach(file => {
  const filePath = path.join(sourceDir, file);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Use json format
  const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // First row has the machine name at A1
  const machineName = json[0] ? json[0][0] : 'Unknown';
  console.log(`\n--- File: ${file} ---`);
  console.log('Machine Name from A1:', machineName);
  
  // The second row contains the headers
  const headers = json[1] || [];
  console.log('Headers:', headers);
  
  // Data starts at row 3 (index 2)
  const dataRows = json.slice(2);
  console.log(`Found ${dataRows.length} rows of data.`);
  if (dataRows.length > 0) {
    console.log('First row data:', dataRows[0]);
  }
});
