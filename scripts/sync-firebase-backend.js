/**
 * Firebase Backend Sync Script
 * 
 * This script downloads the latest Firestore rules, indexes, and Cloud Functions
 * from your Firebase project and saves them to files. Use this to sync your
 * backend configuration across multiple codebases.
 * 
 * Usage: node scripts/sync-firebase-backend.js [download|compare]
 * 
 * Commands:
 *   download - Download current rules/indexes from Firebase
 *   compare  - Compare local files with Firebase (doesn't download)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, '.firebase-backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

// Files to sync
const FILES_TO_SYNC = {
  firestoreRules: {
    local: path.join(PROJECT_ROOT, 'firestore.rules'),
    backup: path.join(BACKUP_DIR, `firestore.rules.${TIMESTAMP}.backup`),
    name: 'Firestore Security Rules'
  },
  firestoreIndexes: {
    local: path.join(PROJECT_ROOT, 'firestore.indexes.json'),
    backup: path.join(BACKUP_DIR, `firestore.indexes.json.${TIMESTAMP}.backup`),
    name: 'Firestore Indexes'
  },
  storageRules: {
    local: path.join(PROJECT_ROOT, 'storage.rules'),
    backup: path.join(BACKUP_DIR, `storage.rules.${TIMESTAMP}.backup`),
    name: 'Storage Security Rules'
  },
  functionsIndex: {
    local: path.join(PROJECT_ROOT, 'functions', 'index.js'),
    backup: path.join(BACKUP_DIR, `functions-index.js.${TIMESTAMP}.backup`),
    name: 'Cloud Functions'
  },
  functionsPackage: {
    local: path.join(PROJECT_ROOT, 'functions', 'package.json'),
    backup: path.join(BACKUP_DIR, `functions-package.json.${TIMESTAMP}.backup`),
    name: 'Functions Dependencies'
  }
};

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log.info(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Get current Firebase project ID
 */
function getFirebaseProject() {
  try {
    const result = execSync('firebase use', { encoding: 'utf-8' });
    const match = result.match(/Active Project: (.*) \(/);
    return match ? match[1] : null;
  } catch (error) {
    log.error('Could not determine Firebase project. Run: firebase use <project-id>');
    return null;
  }
}

/**
 * Download Firestore rules from Firebase
 */
function downloadFirestoreRules() {
  log.info('Downloading Firestore rules from Firebase...');
  
  try {
    const rules = execSync('firebase firestore:rules:get', { encoding: 'utf-8' });
    
    // Backup existing file
    if (fs.existsSync(FILES_TO_SYNC.firestoreRules.local)) {
      fs.copyFileSync(
        FILES_TO_SYNC.firestoreRules.local,
        FILES_TO_SYNC.firestoreRules.backup
      );
      log.info(`Backed up existing rules to: ${path.basename(FILES_TO_SYNC.firestoreRules.backup)}`);
    }
    
    // Write new rules
    fs.writeFileSync(FILES_TO_SYNC.firestoreRules.local, rules);
    log.success('Downloaded Firestore rules');
    
    return true;
  } catch (error) {
    log.error(`Failed to download Firestore rules: ${error.message}`);
    return false;
  }
}

/**
 * Download Firestore indexes from Firebase
 */
function downloadFirestoreIndexes() {
  log.info('Downloading Firestore indexes from Firebase...');
  
  try {
    const indexes = execSync('firebase firestore:indexes', { encoding: 'utf-8' });
    
    // Parse the output to extract JSON
    // Firebase CLI outputs indexes in a specific format
    // For now, we'll just inform the user
    log.warning('Firestore indexes must be manually exported from Firebase Console');
    log.info('Go to: https://console.firebase.google.com/project/_/firestore/indexes');
    log.info('Export indexes and save to: firestore.indexes.json');
    
    return false;
  } catch (error) {
    log.error(`Failed to list indexes: ${error.message}`);
    return false;
  }
}

/**
 * Compare local file with backup
 */
function compareFiles(localPath, backupPath, name) {
  if (!fs.existsSync(localPath)) {
    log.warning(`${name}: Local file not found`);
    return 'missing';
  }
  
  if (!fs.existsSync(backupPath)) {
    log.info(`${name}: No backup to compare`);
    return 'no-backup';
  }
  
  const localContent = fs.readFileSync(localPath, 'utf-8');
  const backupContent = fs.readFileSync(backupPath, 'utf-8');
  
  if (localContent === backupContent) {
    log.success(`${name}: No changes`);
    return 'identical';
  } else {
    log.warning(`${name}: Files differ`);
    return 'different';
  }
}

/**
 * Create a package with all backend files
 */
function createSyncPackage() {
  const packageName = `firebase-backend-${TIMESTAMP}.zip`;
  const packagePath = path.join(BACKUP_DIR, packageName);
  
  log.header('Creating sync package...');
  
  try {
    // Create a temporary directory for packaging
    const tempDir = path.join(BACKUP_DIR, 'temp-sync');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Copy all files to temp directory
    Object.keys(FILES_TO_SYNC).forEach(key => {
      const file = FILES_TO_SYNC[key];
      if (fs.existsSync(file.local)) {
        const destPath = path.join(tempDir, path.basename(file.local));
        fs.copyFileSync(file.local, destPath);
        log.info(`Added: ${file.name}`);
      }
    });
    
    // Create README
    const readme = `
# Firebase Backend Sync Package
Generated: ${new Date().toISOString()}
Project: ${getFirebaseProject()}

## Files Included:
- firestore.rules - Firestore security rules
- firestore.indexes.json - Firestore composite indexes
- storage.rules - Storage security rules
- index.js - Cloud Functions code
- package.json - Cloud Functions dependencies

## How to Use:
1. Extract this package to your codebase
2. Copy files to appropriate locations:
   - firestore.rules → ./firestore.rules
   - firestore.indexes.json → ./firestore.indexes.json
   - storage.rules → ./storage.rules
   - index.js → ./functions/index.js
   - package.json → ./functions/package.json

3. Deploy to your Firebase project:
   \`\`\`bash
   firebase deploy --only firestore
   firebase deploy --only storage
   cd functions && npm install && cd ..
   firebase deploy --only functions
   \`\`\`

## Important Notes:
- Always backup your existing files before overwriting
- Review the changes before deploying
- Test in a development environment first
- Update service account keys if needed
`;
    
    fs.writeFileSync(path.join(tempDir, 'README.md'), readme);
    
    log.success(`Sync package prepared in: ${tempDir}`);
    log.info('Package contents:');
    log.info('  - firestore.rules');
    log.info('  - firestore.indexes.json');
    log.info('  - storage.rules');
    log.info('  - functions/index.js');
    log.info('  - functions/package.json');
    log.info('  - README.md');
    
    return tempDir;
    
  } catch (error) {
    log.error(`Failed to create sync package: ${error.message}`);
    return null;
  }
}

/**
 * Display file sizes and modification dates
 */
function displayFileInfo() {
  log.header('Current Backend Files:');
  
  Object.keys(FILES_TO_SYNC).forEach(key => {
    const file = FILES_TO_SYNC[key];
    
    if (fs.existsSync(file.local)) {
      const stats = fs.statSync(file.local);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const modified = stats.mtime.toISOString().split('T')[0];
      
      console.log(`  ${colors.cyan}${file.name}${colors.reset}`);
      console.log(`    Path: ${path.relative(PROJECT_ROOT, file.local)}`);
      console.log(`    Size: ${sizeKB} KB`);
      console.log(`    Modified: ${modified}`);
    } else {
      console.log(`  ${colors.red}${file.name}${colors.reset}`);
      console.log(`    Status: NOT FOUND`);
    }
    console.log('');
  });
}

/**
 * Main execution
 */
function main() {
  const command = process.argv[2] || 'info';
  
  console.log('');
  log.header('╔════════════════════════════════════════════════════════════╗');
  log.header('║   Firebase Backend Sync Tool                              ║');
  log.header('║   AnyRyde Driver App                                       ║');
  log.header('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const project = getFirebaseProject();
  if (project) {
    log.info(`Firebase Project: ${colors.bright}${project}${colors.reset}`);
  } else {
    log.warning('No Firebase project selected');
  }
  console.log('');
  
  ensureBackupDir();
  
  switch (command) {
    case 'download':
      log.header('Downloading from Firebase...');
      downloadFirestoreRules();
      downloadFirestoreIndexes();
      log.info('\nNote: Some files must be manually exported from Firebase Console');
      break;
      
    case 'compare':
      log.header('Comparing local files with backups...');
      Object.keys(FILES_TO_SYNC).forEach(key => {
        const file = FILES_TO_SYNC[key];
        compareFiles(file.local, file.backup, file.name);
      });
      break;
      
    case 'package':
      const packageDir = createSyncPackage();
      if (packageDir) {
        log.success(`\nSync package ready: ${packageDir}`);
        log.info('\nTo share with other codebases:');
        log.info(`  1. Copy the contents of: ${packageDir}`);
        log.info('  2. Place in other codebase directories');
        log.info('  3. Run: firebase deploy --only firestore,storage,functions');
      }
      break;
      
    case 'info':
    default:
      displayFileInfo();
      log.info('Available commands:');
      log.info('  node scripts/sync-firebase-backend.js info     - Show file information (default)');
      log.info('  node scripts/sync-firebase-backend.js download - Download from Firebase');
      log.info('  node scripts/sync-firebase-backend.js compare  - Compare with backups');
      log.info('  node scripts/sync-firebase-backend.js package  - Create sync package');
      break;
  }
  
  console.log('');
  log.success('Script complete!');
  console.log('');
}

// Run the script
try {
  main();
} catch (error) {
  log.error(`Script failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}

