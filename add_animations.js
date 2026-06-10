const fs = require('fs');
const path = require('path');

const addAnimations = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add animations to Cards
  content = content.replace(/<Card\s/g, '<Card className="dash-animate-fade-in-up" ');
  
  // Add animations to Table
  content = content.replace(/<Table\s/g, '<Table className="dash-animate-fade-in-up" ');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

const dirs = [
  'frontend/src/pages/admin',
  'frontend/src/pages/landlord',
  'frontend/src/pages/tenant',
];

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      addAnimations(fullPath);
    }
  }
};

dirs.forEach(d => walk(path.join(__dirname, d)));

// Also add to Layout components
const layouts = [
  'frontend/src/components/AdminLayout.js',
  'frontend/src/components/DashboardLayout.js',
  'frontend/src/components/Layout.js',
  'frontend/src/components/TenantLayout.js'
];

layouts.forEach(l => {
  const filePath = path.join(__dirname, l);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('dash-animate-fade-in-up')) {
    content = content.replace(/<Outlet \/>/g, '<div className="dash-animate-fade-in-up"><Outlet /></div>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated Layout:', filePath);
  }
});

console.log('Animations added back.');
