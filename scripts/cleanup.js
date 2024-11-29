import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORE_DIRS = [
  'node_modules',
  'dist',
  '.git',
  'coverage',
  'scripts'
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (IGNORE_DIRS.some(ignore => filePath.includes(ignore))) {
      return;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      fileList = getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function countImports(filePath) {
  try {
    const fileName = path.basename(filePath, path.extname(filePath));
    const grepCommand = `git grep -l "${fileName}" ${ROOT_DIR}`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    return result.split('\n').filter(Boolean).length;
  } catch (error) {
    return 0;
  }
}

function analyzeFiles() {
  const allFiles = getAllFiles(ROOT_DIR);
  const stats = [];

  allFiles.forEach(filePath => {
    const stat = fs.statSync(filePath);
    stats.push({
      path: filePath,
      size: stat.size,
      lastModified: new Date(stat.mtime),
      imports: countImports(filePath)
    });
  });

  return stats;
}

function findEmptyDirectories(dir) {
  const emptyDirs = [];

  function isDirectoryEmpty(dirPath) {
    const items = fs.readdirSync(dirPath);
    return items.length === 0;
  }

  function scan(dirPath) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      if (IGNORE_DIRS.some(ignore => fullPath.includes(ignore))) {
        continue;
      }

      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
        if (isDirectoryEmpty(fullPath)) {
          emptyDirs.push(fullPath);
        }
      }
    }
  }

  scan(dir);
  return emptyDirs;
}

function generateReport() {
  console.log('Analyzing project files...\n');

  // Find empty directories
  const emptyDirs = findEmptyDirectories(ROOT_DIR);
  if (emptyDirs.length > 0) {
    console.log('Empty directories found:');
    emptyDirs.forEach(dir => console.log(`- ${path.relative(ROOT_DIR, dir)}`));
    console.log();
  }

  // Analyze files
  const fileStats = analyzeFiles();

  // Find potentially unused files (no imports and not recently modified)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const unusedFiles = fileStats.filter(stat => 
    stat.imports === 0 && 
    stat.lastModified < thirtyDaysAgo &&
    !stat.path.includes('package.json') &&
    !stat.path.includes('tsconfig.json') &&
    !stat.path.includes('vite.config') &&
    !stat.path.includes('index.html')
  );

  if (unusedFiles.length > 0) {
    console.log('Potentially unused files:');
    unusedFiles.forEach(file => {
      console.log(`- ${path.relative(ROOT_DIR, file.path)}`);
      console.log(`  Last modified: ${file.lastModified.toLocaleDateString()}`);
      console.log(`  Size: ${(file.size / 1024).toFixed(2)} KB`);
    });
    console.log();
  }

  // Find large files
  const largeFiles = fileStats
    .filter(stat => stat.size > 100 * 1024) // Files larger than 100KB
    .sort((a, b) => b.size - a.size);

  if (largeFiles.length > 0) {
    console.log('Large files (>100KB):');
    largeFiles.forEach(file => {
      console.log(`- ${path.relative(ROOT_DIR, file.path)}`);
      console.log(`  Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`  Imports: ${file.imports}`);
    });
  }
}

generateReport();
