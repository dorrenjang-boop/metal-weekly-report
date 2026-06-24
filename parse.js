const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, 'raw.txt');

// We will use native fetch

async function parseAndSeed() {
  const content = fs.readFileSync(RAW_FILE, 'utf8');
  
  const dates = {
    "5/1~5/15": "2026-05-15",
    "5/18 ~ 5/22": "2026-05-22",
    "5/25~5/29": "2026-05-29",
    "6/1 ~ 6/5": "2026-06-05",
    "6/8 ~ 6/12": "2026-06-12"
  };

  const reportsMap = {}; // { date: { name: { thisWeekTask: [], nextWeekTask: [] } } }

  let currentDate = null;
  let isNextWeek = false;

  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let line of lines) {
    if (line.includes('금주업무') || line.includes('금주 업무')) {
      isNextWeek = false;
      // find date
      for (const [key, val] of Object.entries(dates)) {
        if (line.includes(key) || line.replace(/\s/g, '').includes(key.replace(/\s/g, ''))) {
          currentDate = val;
          break;
        }
      }
      continue;
    }
    
    if (line.includes('차주업무') || line.includes('차주 업무')) {
      isNextWeek = true;
      continue;
    }

    if (!currentDate) {
      for (const [key, val] of Object.entries(dates)) {
        if (line.includes(key) || line.replace(/\s/g, '').includes(key.replace(/\s/g, ''))) {
          currentDate = val;
          break;
        }
      }
    }

    if (!currentDate) continue;

    // Detect names like (장동훈), (김진석, 배지훈)
    const nameMatch = line.match(/\(([가-힣,\s]+)\)$/);
    if (nameMatch) {
      const namesStr = nameMatch[1];
      const names = namesStr.split(',').map(n => n.trim().replace('지원', '').trim());
      const taskText = line.replace(nameMatch[0], '').trim();

      if (!reportsMap[currentDate]) reportsMap[currentDate] = {};

      for (const name of names) {
        if (name.length > 4 || name.length < 2) continue; // heuristic
        if (name === '수') continue;
        
        if (!reportsMap[currentDate][name]) {
          reportsMap[currentDate][name] = { thisWeekTask: [], nextWeekTask: [] };
        }

        if (isNextWeek) {
          reportsMap[currentDate][name].nextWeekTask.push(taskText);
        } else {
          reportsMap[currentDate][name].thisWeekTask.push(taskText);
        }
      }
    }
  }

  // Submit to API
  const url = `http://localhost:5000/api/reports`;
  
  for (const date of Object.keys(reportsMap)) {
    for (const name of Object.keys(reportsMap[date])) {
      const data = reportsMap[date][name];
      const payload = {
        date: new Date(date).toISOString(),
        name: name,
        thisWeekTask: data.thisWeekTask.join('\n'),
        nextWeekTask: data.nextWeekTask.join('\n'),
        project: '',
        printer: '',
        keywords: ''
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          console.error(`Failed to post for ${name} at ${date}:`, await res.text());
        } else {
          console.log(`Success: ${name} at ${date}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
}

parseAndSeed().then(() => console.log('Done'));
