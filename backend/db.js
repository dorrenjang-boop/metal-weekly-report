const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const db = {
  machines: [],
  materials: [],
  build_logs: [],
  oee_records: []
};

// =====================================
// Data Initialization (Parsing XLSX)
// =====================================
function initDB() {
  const sourceDir = path.join(__dirname, '../source');
  if (!fs.existsSync(sourceDir)) return;

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.xlsx'));
  
  const machineMap = new Map();
  const materialSet = new Set();
  
  let buildIdCounter = 1;

  files.forEach(file => {
    const filePath = path.join(sourceDir, file);
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      // Parse metadata from filename and rows
      const fileParts = file.split('_');
      const machineCode = fileParts[0];
      let materialCode = fileParts[1] ? fileParts[1].replace('.xlsx', '') : 'Unknown';
      
      // Standardize material names
      if (materialCode.includes('Aluminium') || materialCode.includes('AlSi10')) materialCode = 'AlSi10Mg';
      else if (materialCode.includes('Ti6Al4V')) materialCode = 'Ti6Al4V';
      else if (materialCode.includes('IN718') || materialCode.includes('Inconel')) materialCode = 'IN718';
      else if (materialCode.includes('STS') || materialCode.includes('316L')) materialCode = 'STS316L';
      else if (materialCode.includes('CuCr')) materialCode = 'CuCr2_4';
      else if (materialCode.includes('Maraging')) materialCode = 'Maraging Steel';
      else if (materialCode.includes('CoCr')) materialCode = 'CoCr';

      const machineName = (json[1] && json[1][0]) ? json[1][0] : machineCode;
      
      if (!machineMap.has(machineCode)) {
        machineMap.set(machineCode, { id: machineCode, name: machineName, material: materialCode });
      }
      materialSet.add(materialCode);
      
      // The 3rd row (index 2) contains data headers
      const headers = json[2] || [];
      const nameIdx = headers.indexOf('Name');
      const engIdx = headers.indexOf('Engineer');
      const stateIdx = headers.indexOf('Completion State');
      const typeIdx = headers.indexOf('Job Type');
      const startIdx = headers.indexOf('Schedule - Start');
      const endIdx = headers.indexOf('Schedule - End');
      const runTimeIdx = headers.indexOf('Run Time(hr)');
      const volIdx = headers.indexOf('Volume(mm³)');
      const issueIdx = headers.indexOf('Issue/Error');
      const detailIdx = headers.indexOf('Issue Detail');
      const clientIdx = headers.indexOf('Client / Project');
      const categoryIdx = headers.indexOf('Product Category');
      const purposeIdx = headers.indexOf('Description'); // Or Build Purpose
      const powderIdx = headers.indexOf('Powder Usage(kg)');
      
      if (nameIdx === -1) return; // Skip if invalid

      // Helper to format Excel date numbers to YYYY-MM-DD
      const formatExcelDate = (val) => {
        if (!val) return '';
        if (typeof val === 'number') {
          try { return xlsx.SSF.format('yyyy-mm-dd', val); } catch(e) { return val; }
        }
        return val.toString();
      };

      for (let i = 3; i < json.length; i++) {
        const row = json[i];
        if (!row || !row[nameIdx]) continue;
        
        let build_name = row[nameIdx] || '';
        // Map machine names in build_name
        build_name = build_name.replace(/A40PM02/g, 'A40PM3SN01')
                               .replace(/A40PM01/g, 'A40PM3SN02')
                               .replace(/A65PM01/g, 'A65PM8SN01')
                               .replace(/A65PM02/g, 'A65PM8SN02');

        const fail_reason = (row[issueIdx] || '') + (row[detailIdx] ? ' - ' + row[detailIdx] : '');
        
        db.build_logs.push({
          id: `b${buildIdCounter++}`,
          machine_id: machineCode,
          material: materialCode,
          build_name: build_name,
          engineer: row[engIdx] || '',
          start_date: formatExcelDate(row[startIdx]),
          end_date: formatExcelDate(row[endIdx]),
          completion_state: row[stateIdx] || 'Success',
          job_type: row[typeIdx] || '',
          run_time_hr: parseFloat(row[runTimeIdx]) || 0,
          volume_mm3: parseFloat(row[volIdx]) || 0,
          powder_weight_kg: parseFloat(row[powderIdx]) || 0,
          client_project: row[clientIdx] || '',
          product_category: row[categoryIdx] || '',
          build_purpose: row[purposeIdx] || '',
          description: row[purposeIdx] || '', // Excel Description column
          issue_detail: row[detailIdx] || '', // Excel Issue Detail column
          fail_reason: fail_reason,
          fail_layer: '', // User wants to input this manually if failed
          image_base64: '' // For the mock image upload feature
        });
      }
      
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err);
    }
  });

  db.machines = Array.from(machineMap.values());
  db.materials = Array.from(materialSet);
  console.log(`Initialized DB with ${db.machines.length} machines, ${db.materials.length} materials, and ${db.build_logs.length} build logs.`);
}

initDB();

// =====================================
// OEE Automatic Calculation Logic
// =====================================
function calculateOEE() {
  const oeeByMachine = {};
  
  // Group builds by machine
  db.build_logs.forEach(log => {
    if (!oeeByMachine[log.machine_id]) {
      oeeByMachine[log.machine_id] = {
        machine_id: log.machine_id,
        planned_time_hr: 0,
        run_time_hr: 0,
        success_count: 0,
        total_count: 0,
        volume_sum: 0
      };
    }
    const m = oeeByMachine[log.machine_id];
    // Simple heuristic for mock: assume planned time is 168 hrs per week, or just base it on run time + 10 hrs down
    m.run_time_hr += (log.run_time_hr || 0);
    m.total_count += 1;
    m.volume_sum += (log.volume_mm3 || 0);
    if (log.completion_state === 'Success' || log.completion_state === 'Done') {
      m.success_count += 1;
    }
  });
  
  const results = Object.values(oeeByMachine).map(m => {
    // Artificial OEE math for the dashboard
    const planned_time_hr = Math.max(m.run_time_hr + 20, 100); 
    const availability = m.run_time_hr / planned_time_hr;
    
    // Performance: mock performance based on average volume
    const performance = 0.85 + (Math.random() * 0.1); // 85% ~ 95%
    
    const quality = m.total_count > 0 ? (m.success_count / m.total_count) : 0;
    const oee = availability * performance * quality;
    
    return {
      id: m.machine_id,
      machine_id: m.machine_id,
      availability: availability * 100,
      performance: performance * 100,
      quality: quality * 100,
      oee: oee * 100,
      run_time_hr: m.run_time_hr,
      total_count: m.total_count
    };
  });
  
  return results;
}

// =====================================
// API Methods
// =====================================
const getMetadata = async () => ({
  machines: db.machines,
  materials: db.materials
});
const getBuildLogs = async () => db.build_logs;
const getOEERecords = async () => calculateOEE();

const updateBuildLog = async (id, updates) => {
  const index = db.build_logs.findIndex(b => b.id === id);
  if (index !== -1) {
    db.build_logs[index] = { ...db.build_logs[index], ...updates };
    return db.build_logs[index];
  }
  throw new Error("Build log not found");
};

const addBuildLog = async (log) => {
  const newLog = { ...log, id: `b_new_${Date.now()}` };
  db.build_logs.push(newLog);
  return newLog;
};

const deleteBuildLog = async (id) => {
  db.build_logs = db.build_logs.filter(b => b.id !== id);
  return { message: "Deleted" };
};

module.exports = {
  getMetadata,
  getBuildLogs,
  getOEERecords,
  addBuildLog,
  updateBuildLog,
  deleteBuildLog
};
