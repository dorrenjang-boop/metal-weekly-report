const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../source');
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.xlsx'));

let allBuilds = [];

files.forEach(file => {
  const wb = xlsx.readFile(path.join(sourceDir, file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find header row
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    if (jsonData[i].includes('Name') || jsonData[i].includes('Engineer')) {
      headerRowIdx = i;
      break;
    }
  }
  
  const headers = jsonData[headerRowIdx];
  const dataRows = jsonData.slice(headerRowIdx + 1);
  
  // Derive machine and material from filename (e.g., A65PM8SN01_IN718_...)
  const parts = file.split('_');
  const machine_id = parts[0];
  const material = parts[1];

  dataRows.forEach((row, idx) => {
    if (!row || row.length === 0 || !row[0]) return; // Skip empty rows
    
    let buildObj = {
      id: `${machine_id}-${idx}-${Date.now()}`,
      machine_id: machine_id,
      material: material,
    };
    
    headers.forEach((header, colIdx) => {
      if (!header) return;
      const val = row[colIdx];
      if (header === 'Name') buildObj.build_name = val || '';
      else if (header === 'Engineer') buildObj.engineer = val || '';
      else if (header === 'Schedule - Start') buildObj.start_date = val || '';
      else if (header === 'Schedule - End') buildObj.end_date = val || '';
      else if (header === 'Completion State') buildObj.completion_state = val || '';
      else if (header === 'Job Type') buildObj.job_type = val || '';
      else if (header === 'Run Time(hr)') buildObj.run_time_hr = parseFloat(val) || 0;
      else if (header === 'Client / Project') buildObj.client_project = val || '';
      else if (header === 'Product Category') buildObj.product_category = val || '';
      else if (header === 'Issue/Error') buildObj.issue_error = val || '';
    });
    
    allBuilds.push(buildObj);
  });
});

fs.writeFileSync(path.join(__dirname, 'mock_db.json'), JSON.stringify({ builds: allBuilds }, null, 2));
console.log(`Parsed ${allBuilds.length} build records.`);
