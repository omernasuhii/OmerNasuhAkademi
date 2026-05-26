const { execSync } = require('child_process');
try {
  const output = execSync('npm run build', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.error("FAIL", e.stdout, e.stderr);
}
