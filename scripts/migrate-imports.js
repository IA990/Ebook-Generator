const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../src');
const BACKUP_DIR = path.resolve(__dirname, '../backup_before_migration');

const ALIASES = {
  '@/': 'src/',
  '@components/': 'src/components/',
  '@pdf/': 'src/lib/pdf/',
  '@i18n/': 'src/i18n/',
};

// Regex patterns to match relative imports
const RELATIVE_IMPORT_REGEX = /import\s+([^'"]+)\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const REQUIRE_REGEX = /require\(['"](\.{1,2}\/[^'"]+)['"]\)/g;

// File extensions to process
const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

// Backup files before migration
function backupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  copyDir(SRC_DIR, BACKUP_DIR);
  console.log(`Backup created at ${BACKUP_DIR}`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Convert relative path to alias path if possible
function convertPath(filePath, importPath) {
  const absoluteImportPath = path.resolve(path.dirname(filePath), importPath);
  for (const [alias, targetPath] of Object.entries(ALIASES)) {
    const aliasTargetAbs = path.resolve(__dirname, '../', targetPath);
    if (absoluteImportPath.startsWith(aliasTargetAbs)) {
      const relativeToAlias = path.relative(aliasTargetAbs, absoluteImportPath).replace(/\\/g, '/');
      return alias + relativeToAlias;
    }
  }
  return null;
}

// Process a single file
function processFile(filePath, dryRun = true) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  let changes = [];

  // Replace import statements
  content = content.replace(RELATIVE_IMPORT_REGEX, (match, imports, importPath) => {
    const newPath = convertPath(filePath, importPath);
    if (newPath) {
      changed = true;
      changes.push({ old: importPath, new: newPath });
      return `import ${imports} from '${newPath}'`;
    }
    return match;
  });

  // Replace require statements
  content = content.replace(REQUIRE_REGEX, (match, importPath) => {
    const newPath = convertPath(filePath, importPath);
    if (newPath) {
      changed = true;
      changes.push({ old: importPath, new: newPath });
      return `require('${newPath}')`;
    }
    return match;
  });

  if (changed && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { filePath, changed, changes };
}

// Recursively process directory
function processDir(dir, dryRun = true) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...processDir(fullPath, dryRun));
    } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(processFile(fullPath, dryRun));
    }
  }
  return results;
}

// Main function
function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!dryRun) {
    backupFiles();
  }
  const results = processDir(SRC_DIR, dryRun);
  const changedFiles = results.filter(r => r.changed);

  console.log(`\nMigration ${dryRun ? 'dry-run' : 'run'} report:`);
  console.log(`Total files processed: ${results.length}`);
  console.log(`Files with changes: ${changedFiles.length}`);

  changedFiles.forEach(({ filePath, changes }) => {
    console.log(`\nFile: ${filePath}`);
    changes.forEach(({ old, new: newPath }) => {
      console.log(`  Replaced: '${old}' -> '${newPath}'`);
    });
  });

  if (dryRun) {
    console.log('\nDry-run complete. No files were modified.');
  } else {
    console.log('\nMigration complete. Files updated and backup created.');
  }
}

main();
