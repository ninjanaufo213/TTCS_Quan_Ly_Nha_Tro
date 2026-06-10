const fs = require('fs');
const path = require('path');

const dirs = [
  'frontend/src/pages/admin',
  'frontend/src/pages/landlord',
  'frontend/src/pages/tenant',
];

const colorReplacements = {
  "'#0f3460'": "'var(--dash-text-dark)'",
  "'#e94560'": "'var(--dash-text-dark)'",
  "'#f5a623'": "'var(--dash-text-muted)'",
  "'#1890ff'": "'var(--dash-text-dark)'",
  "'#52c41a'": "'var(--dash-text-muted)'",
  "'#00c9a7'": "'var(--dash-text-muted)'",
  "'#7b61ff'": "'var(--dash-text-muted)'",
  "'#febc2e'": "'var(--dash-text-muted)'",
  "'#ff6b6b'": "'var(--dash-text-muted)'",
  "'blue'": "'default'",
  '"blue"': '"default"',
  '"success"': '"default"',
  '"warning"': '"default"',
  '"error"': '"default"',
  '"processing"': '"default"'
};

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace colors
  for (const [oldColor, newColor] of Object.entries(colorReplacements)) {
    content = content.split(oldColor).join(newColor);
  }

  // Replace linear-gradients
  content = content.replace(/linear-gradient\([^)]+\)/g, "'var(--dash-bg-light-alt)'");

  // Replace string interpolations with linear-gradients like `linear-gradient(135deg, ${color}15, ${color}08)`
  content = content.replace(/`linear-gradient[^`]+`/g, "'var(--dash-bg-light-alt)'");

  // Add animations to Cards
  content = content.replace(/<Card\s/g, '<Card className="dash-animate-fade-in-up" ');
  
  // Add animations to Table
  content = content.replace(/<Table\s/g, '<Table className="dash-animate-fade-in-up" ');
  
  // Add animations to Row
  // content = content.replace(/<Row\s/g, '<Row className="dash-animate-fade-in-up" ');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
};

dirs.forEach(d => walk(path.join(__dirname, d)));
console.log('Theme update complete.');
