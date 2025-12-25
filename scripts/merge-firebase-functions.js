/**
 * Merge Firebase Functions from Multiple Codebases
 * 
 * This script merges Cloud Functions from multiple codebases into a single
 * master functions file that can be shared across all projects.
 * 
 * Usage: node scripts/merge-firebase-functions.js
 */

const fs = require('fs');
const path = require('path');

// Colors
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

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SYNC_DIR = path.join(PROJECT_ROOT, '.firebase-sync');
const FUNCTIONS_DIR = path.join(PROJECT_ROOT, 'functions');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

/**
 * Extract exported functions from a JS file
 */
function extractExportsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { functions: [], content: '' };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const functions = [];
  
  // Match exports.functionName = ...
  const exportMatches = content.matchAll(/exports\.(\w+)\s*=/g);
  
  for (const match of exportMatches) {
    functions.push(match[1]);
  }
  
  return { functions, content };
}

/**
 * Merge package.json dependencies
 */
function mergePackageJsons(files) {
  const merged = {
    name: 'anyryde-consolidated-functions',
    version: '1.0.0',
    description: 'Consolidated Cloud Functions from all AnyRyde codebases',
    scripts: {
      lint: 'eslint .',
      serve: 'firebase emulators:start --only functions',
      shell: 'firebase functions:shell',
      start: 'npm run shell',
      deploy: 'firebase deploy --only functions',
      logs: 'firebase functions:log'
    },
    engines: { node: '>=18' },
    main: 'index.js',
    dependencies: {},
    devDependencies: {}
  };
  
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    try {
      const pkg = JSON.parse(fs.readFileSync(file, 'utf-8'));
      
      // Merge dependencies
      if (pkg.dependencies) {
        Object.keys(pkg.dependencies).forEach(dep => {
          // Use the highest version if conflict
          if (!merged.dependencies[dep] || 
              merged.dependencies[dep] < pkg.dependencies[dep]) {
            merged.dependencies[dep] = pkg.dependencies[dep];
          }
        });
      }
      
      // Merge devDependencies
      if (pkg.devDependencies) {
        Object.keys(pkg.devDependencies).forEach(dep => {
          if (!merged.devDependencies[dep] || 
              merged.devDependencies[dep] < pkg.devDependencies[dep]) {
            merged.devDependencies[dep] = pkg.devDependencies[dep];
          }
        });
      }
    } catch (error) {
      log.warning(`Could not parse ${file}: ${error.message}`);
    }
  });
  
  return merged;
}

/**
 * Create master functions file
 */
function createMasterFunctionsFile() {
  log.header('Creating Master Functions File...');
  
  // Look for codebase files in sync directory
  const codebaseFiles = [
    path.join(SYNC_DIR, 'codebase-a-functions.js'),
    path.join(SYNC_DIR, 'codebase-b-functions.js'),
    path.join(SYNC_DIR, 'codebase-c-functions.js'),
    path.join(FUNCTIONS_DIR, 'index.js') // Current codebase
  ];
  
  const allFunctions = new Map(); // functionName => { content, source }
  const duplicates = [];
  
  codebaseFiles.forEach((file, index) => {
    if (!fs.existsSync(file)) {
      log.warning(`File not found: ${path.basename(file)}`);
      return;
    }
    
    const source = index === 3 ? 'Current' : `Codebase ${String.fromCharCode(65 + index)}`;
    log.info(`Processing: ${source} (${path.basename(file)})`);
    
    const { functions, content } = extractExportsFromFile(file);
    
    functions.forEach(fnName => {
      if (allFunctions.has(fnName)) {
        duplicates.push({
          name: fnName,
          original: allFunctions.get(fnName).source,
          duplicate: source
        });
        log.warning(`  Duplicate: ${fnName} (already in ${allFunctions.get(fnName).source})`);
      } else {
        // Extract the full function definition
        const regex = new RegExp(
          `exports\\.${fnName}\\s*=.*?(?=exports\\.|$)`,
          'gs'
        );
        const match = content.match(regex);
        
        if (match) {
          allFunctions.set(fnName, {
            content: match[0],
            source: source
          });
          log.success(`  Added: ${fnName}`);
        }
      }
    });
  });
  
  // Group functions by category
  const categorized = {
    video: [],
    payment: [],
    notification: [],
    driver: [],
    ride: [],
    scheduled: [],
    webhook: [],
    other: []
  };
  
  allFunctions.forEach((data, name) => {
    const lower = name.toLowerCase();
    if (lower.includes('video') || lower.includes('recording') || lower.includes('incident')) {
      categorized.video.push({ name, ...data });
    } else if (lower.includes('payment') || lower.includes('stripe') || lower.includes('refund')) {
      categorized.payment.push({ name, ...data });
    } else if (lower.includes('notification') || lower.includes('alert')) {
      categorized.notification.push({ name, ...data });
    } else if (lower.includes('driver') || lower.includes('application')) {
      categorized.driver.push({ name, ...data });
    } else if (lower.includes('ride') || lower.includes('location')) {
      categorized.ride.push({ name, ...data });
    } else if (lower.includes('scheduled') || lower.includes('reminder')) {
      categorized.scheduled.push({ name, ...data });
    } else if (lower.includes('webhook')) {
      categorized.webhook.push({ name, ...data });
    } else {
      categorized.other.push({ name, ...data });
    }
  });
  
  // Generate master file
  let masterContent = `/**
 * AnyRyde Consolidated Cloud Functions
 * Generated: ${new Date().toISOString()}
 * 
 * This file consolidates Cloud Functions from multiple codebases:
 * - Video Recording Functions: ${categorized.video.length}
 * - Payment Functions: ${categorized.payment.length}
 * - Notification Functions: ${categorized.notification.length}
 * - Driver Management Functions: ${categorized.driver.length}
 * - Ride Management Functions: ${categorized.ride.length}
 * - Scheduled Functions: ${categorized.scheduled.length}
 * - Webhook Functions: ${categorized.webhook.length}
 * - Other Functions: ${categorized.other.length}
 * 
 * Total: ${allFunctions.size} functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
admin.initializeApp();

const db = admin.firestore();

`;

  // Add each category
  const categories = [
    { key: 'video', name: 'Video Recording Functions' },
    { key: 'payment', name: 'Payment & Stripe Functions' },
    { key: 'notification', name: 'Notification Functions' },
    { key: 'driver', name: 'Driver Management Functions' },
    { key: 'ride', name: 'Ride Management Functions' },
    { key: 'scheduled', name: 'Scheduled/Cron Functions' },
    { key: 'webhook', name: 'Webhook Functions' },
    { key: 'other', name: 'Other Functions' }
  ];
  
  categories.forEach(cat => {
    if (categorized[cat.key].length > 0) {
      masterContent += `
// ============================================
// ${cat.name.toUpperCase()}
// Count: ${categorized[cat.key].length}
// ============================================

`;
      categorized[cat.key].forEach(fn => {
        masterContent += `${fn.content}\n\n`;
      });
    }
  });
  
  return {
    content: masterContent,
    stats: {
      total: allFunctions.size,
      byCategory: Object.fromEntries(
        Object.entries(categorized).map(([k, v]) => [k, v.length])
      ),
      duplicates: duplicates
    }
  };
}

/**
 * Main execution
 */
function main() {
  console.log('');
  log.header('╔════════════════════════════════════════════════════════════╗');
  log.header('║   Merge Firebase Functions - Multi-Codebase Sync          ║');
  log.header('║   AnyRyde Platform                                         ║');
  log.header('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Ensure sync directory exists
  if (!fs.existsSync(SYNC_DIR)) {
    fs.mkdirSync(SYNC_DIR, { recursive: true });
  }
  
  // Check for source files
  log.header('Checking for source files...');
  
  const sourceFiles = {
    'Current Codebase': path.join(FUNCTIONS_DIR, 'index.js'),
    'Codebase A': path.join(SYNC_DIR, 'codebase-a-functions.js'),
    'Codebase B': path.join(SYNC_DIR, 'codebase-b-functions.js'),
    'Codebase C': path.join(SYNC_DIR, 'codebase-c-functions.js')
  };
  
  let foundFiles = 0;
  Object.entries(sourceFiles).forEach(([name, file]) => {
    if (fs.existsSync(file)) {
      log.success(`Found: ${name}`);
      foundFiles++;
    } else {
      log.warning(`Missing: ${name}`);
    }
  });
  
  if (foundFiles === 0) {
    log.error('No source files found!');
    console.log('');
    log.info('To use this script:');
    log.info('1. Copy functions/index.js from each codebase to .firebase-sync/');
    log.info('2. Name them: codebase-a-functions.js, codebase-b-functions.js, codebase-c-functions.js');
    log.info('3. Run this script again');
    console.log('');
    return;
  }
  
  // Create master functions file
  const { content, stats } = createMasterFunctionsFile();
  
  // Save master file
  const masterPath = path.join(FUNCTIONS_DIR, `index-master-${TIMESTAMP}.js`);
  fs.writeFileSync(masterPath, content);
  log.success(`Master file created: ${path.basename(masterPath)}`);
  
  // Merge package.json files
  log.header('Merging package.json dependencies...');
  
  const packageFiles = [
    path.join(SYNC_DIR, 'codebase-a-package.json'),
    path.join(SYNC_DIR, 'codebase-b-package.json'),
    path.join(SYNC_DIR, 'codebase-c-package.json'),
    path.join(FUNCTIONS_DIR, 'package.json')
  ];
  
  const mergedPackage = mergePackageJsons(packageFiles);
  const packagePath = path.join(FUNCTIONS_DIR, `package-master-${TIMESTAMP}.json`);
  fs.writeFileSync(packagePath, JSON.stringify(mergedPackage, null, 2));
  log.success(`Master package.json created: ${path.basename(packagePath)}`);
  
  // Generate summary report
  console.log('');
  log.header('📊 Merge Summary:');
  console.log('');
  log.info(`Total Functions: ${stats.total}`);
  console.log('');
  log.info('By Category:');
  Object.entries(stats.byCategory).forEach(([cat, count]) => {
    if (count > 0) {
      log.info(`  ${cat.padEnd(15)}: ${count}`);
    }
  });
  
  if (stats.duplicates.length > 0) {
    console.log('');
    log.warning(`Duplicate Functions Found: ${stats.duplicates.length}`);
    stats.duplicates.forEach(dup => {
      log.warning(`  ${dup.name}: ${dup.original} vs ${dup.duplicate}`);
    });
    console.log('');
    log.info('Note: Only the first occurrence was included in the master file.');
  }
  
  // Dependencies summary
  console.log('');
  log.info('Merged Dependencies:');
  Object.entries(mergedPackage.dependencies).forEach(([dep, ver]) => {
    log.info(`  ${dep}: ${ver}`);
  });
  
  // Next steps
  console.log('');
  log.header('📝 Next Steps:');
  console.log('');
  log.info('1. Review the master file:');
  log.info(`   ${masterPath}`);
  console.log('');
  log.info('2. Review the master package.json:');
  log.info(`   ${packagePath}`);
  console.log('');
  log.info('3. If everything looks good, replace your current files:');
  log.info(`   cp ${masterPath} functions/index.js`);
  log.info(`   cp ${packagePath} functions/package.json`);
  console.log('');
  log.info('4. Install dependencies:');
  log.info('   cd functions && npm install');
  console.log('');
  log.info('5. Test locally:');
  log.info('   firebase emulators:start --only functions');
  console.log('');
  log.info('6. Deploy to Firebase:');
  log.info('   firebase deploy --only functions');
  console.log('');
  log.info('7. Copy master files to all codebases for future sync');
  console.log('');
  log.success('Merge complete!');
  console.log('');
}

// Run
try {
  main();
} catch (error) {
  log.error(`Script failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}

