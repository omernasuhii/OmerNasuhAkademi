const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else {
      files.push({ path: filePath, size: fs.statSync(filePath).size });
    }
  }
  return files;
}

const files = getFiles('src');
files.sort((a, b) => b.size - a.size);
for (let i = 0; i < 10; i++) {
  if (files[i]) console.log(files[i].path, files[i].size);
}
