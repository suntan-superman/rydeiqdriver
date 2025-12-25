/**
 * Master Sync Script - Complete Workflow Automation
 * 
 * This script automates the entire multi-codebase sync process:
 * 1. Extract deployed functions list
 * 2. Merge functions from multiple codebases
 * 3. Create sync package for distribution
 * 
 * Usage: node scripts/master-sync.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  step: (num, msg) => console.log(`${colors.bright}${colors.magenta}[Step ${num}]${colors.reset} ${msg}`),
};

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SYNC_DIR = path.join(PROJECT_ROOT, '.firebase-sync');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Display banner
 */
function showBanner() {
  console.clear();
  console.log('');
  console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                                                                ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║        🔄  Firebase Multi-Codebase Master Sync  🔄            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                                                                ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║              AnyRyde Platform Consolidation                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║                                                                ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
}

/**
 * Check prerequisites
 */
async function checkPrerequisites() {
  log.header('Checking Prerequisites');
  
  const checks = [];
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    log.success('Firebase CLI installed');
    checks.push(true);
  } catch {
    log.error('Firebase CLI not found. Install with: npm install -g firebase-tools');
    checks.push(false);
  }
  
  // Check if logged into Firebase
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    log.success('Logged into Firebase');
    checks.push(true);
  } catch {
    log.error('Not logged into Firebase. Run: firebase login');
    checks.push(false);
  }
  
  // Check if project is selected
  try {
    const result = execSync('firebase use', { encoding: 'utf-8' });
    const match = result.match(/Active Project: (.*) \(/);
    if (match) {
      log.success(`Firebase project selected: ${match[1]}`);
      checks.push(true);
    } else {
      log.warning('No Firebase project selected. Run: firebase use <project-id>');
      checks.push(false);
    }
  } catch {
    log.error('Could not determine Firebase project');
    checks.push(false);
  }
  
  // Check if functions directory exists
  if (fs.existsSync(path.join(PROJECT_ROOT, 'functions', 'index.js'))) {
    log.success('Functions directory found');
    checks.push(true);
  } else {
    log.error('functions/index.js not found');
    checks.push(false);
  }
  
  console.log('');
  
  if (checks.includes(false)) {
    log.error('Some prerequisites are missing. Please fix them before continuing.');
    return false;
  }
  
  log.success('All prerequisites met!');
  return true;
}

/**
 * Display menu
 */
async function showMenu() {
  console.log('');
  console.log(`${colors.bright}What would you like to do?${colors.reset}`);
  console.log('');
  console.log('  1. 📊 Extract - See what functions are currently deployed');
  console.log('  2. 🔀 Merge   - Consolidate functions from multiple codebases');
  console.log('  3. 📦 Package - Create sync package for other codebases');
  console.log('  4. 🚀 Full    - Run complete workflow (extract → merge → package)');
  console.log('  5. ℹ️  Info    - Show current backend files info');
  console.log('  6. 🚪 Exit    - Quit');
  console.log('');
  
  const choice = await question(`${colors.bright}${colors.cyan}Select option (1-6):${colors.reset} `);
  return choice.trim();
}

/**
 * Run extract script
 */
function runExtract() {
  log.header('Step 1: Extracting Deployed Functions');
  
  try {
    execSync('node scripts/extract-all-firebase-functions.js', { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    return true;
  } catch (error) {
    log.error('Extract failed');
    return false;
  }
}

/**
 * Run merge script
 */
function runMerge() {
  log.header('Step 2: Merging Functions');
  
  // Check if source files exist
  const syncFiles = [
    'codebase-a-functions.js',
    'codebase-b-functions.js',
    'codebase-c-functions.js'
  ];
  
  const foundFiles = syncFiles.filter(file => 
    fs.existsSync(path.join(SYNC_DIR, file))
  );
  
  if (foundFiles.length === 0) {
    log.warning('No codebase files found in .firebase-sync/');
    console.log('');
    log.info('Please copy your functions files to .firebase-sync/:');
    log.info('  cp /path/to/codebase-a/functions/index.js .firebase-sync/codebase-a-functions.js');
    log.info('  cp /path/to/codebase-b/functions/index.js .firebase-sync/codebase-b-functions.js');
    log.info('  cp /path/to/codebase-c/functions/index.js .firebase-sync/codebase-c-functions.js');
    console.log('');
    log.info('Or press Enter to continue with just the current codebase...');
    return false;
  }
  
  try {
    execSync('node scripts/merge-firebase-functions.js', { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    return true;
  } catch (error) {
    log.error('Merge failed');
    return false;
  }
}

/**
 * Run package script
 */
function runPackage() {
  log.header('Step 3: Creating Sync Package');
  
  try {
    execSync('node scripts/sync-firebase-backend.js package', { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    return true;
  } catch (error) {
    log.error('Package creation failed');
    return false;
  }
}

/**
 * Show info
 */
function showInfo() {
  log.header('Backend Files Information');
  
  try {
    execSync('node scripts/sync-firebase-backend.js info', { 
      stdio: 'inherit',
      cwd: PROJECT_ROOT 
    });
    return true;
  } catch (error) {
    log.error('Failed to show info');
    return false;
  }
}

/**
 * Run full workflow
 */
async function runFullWorkflow() {
  log.header('🚀 Running Complete Workflow');
  
  console.log('');
  log.info('This will:');
  log.info('  1. Extract deployed functions from Firebase');
  log.info('  2. Merge functions from multiple codebases');
  log.info('  3. Create sync package for distribution');
  console.log('');
  
  const confirm = await question(`${colors.yellow}Continue? (y/n):${colors.reset} `);
  if (confirm.toLowerCase() !== 'y') {
    log.info('Cancelled');
    return;
  }
  
  // Step 1: Extract
  if (!runExtract()) {
    log.error('Workflow stopped: Extract failed');
    return;
  }
  
  console.log('');
  await question('Press Enter to continue to merge...');
  
  // Step 2: Merge
  if (!runMerge()) {
    log.error('Workflow stopped: Merge failed');
    return;
  }
  
  console.log('');
  await question('Press Enter to continue to package...');
  
  // Step 3: Package
  if (!runPackage()) {
    log.error('Workflow stopped: Package failed');
    return;
  }
  
  console.log('');
  log.success('🎉 Complete workflow finished!');
  console.log('');
  log.header('📝 Next Steps');
  log.info('1. Review the master files in functions/');
  log.info('2. Test locally: firebase emulators:start --only functions');
  log.info('3. Deploy: firebase deploy --only functions');
  log.info('4. Copy master files to other codebases');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  showBanner();
  
  const prereqsPassed = await checkPrerequisites();
  if (!prereqsPassed) {
    rl.close();
    process.exit(1);
  }
  
  let running = true;
  
  while (running) {
    const choice = await showMenu();
    
    switch (choice) {
      case '1':
        runExtract();
        await question('\nPress Enter to continue...');
        break;
        
      case '2':
        runMerge();
        await question('\nPress Enter to continue...');
        break;
        
      case '3':
        runPackage();
        await question('\nPress Enter to continue...');
        break;
        
      case '4':
        await runFullWorkflow();
        await question('\nPress Enter to continue...');
        break;
        
      case '5':
        showInfo();
        await question('\nPress Enter to continue...');
        break;
        
      case '6':
        log.info('Goodbye!');
        running = false;
        break;
        
      default:
        log.warning('Invalid choice. Please select 1-6.');
        await question('\nPress Enter to continue...');
    }
  }
  
  rl.close();
}

// Run
main().catch(error => {
  log.error(`Script failed: ${error.message}`);
  console.error(error.stack);
  rl.close();
  process.exit(1);
});

