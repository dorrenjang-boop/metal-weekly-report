const { execSync } = require('child_process');
try {
  execSync('git checkout backend/server_cloud.js');
  console.log('Restored backend/server_cloud.js from git.');
} catch (e) {
  console.log('Failed to restore:', e.message);
}
