/**
 * Setup Shared Folder Structure for Multiple Codebases
 * 
 * This script sets up a shared folder structure for functions, scripts,
 * and Firebase configuration files that all 3 codebases can reference.
 * 
 * Structure:
 * C:\Users\sjroy\Source\rydeIQ\
 *   ├── functions/           ← Shared
 *   ├── scripts/             ← Shared
 *   ├── firestore.rules      ← Shared
 *   ├── firestore.indexes.json ← Shared
 *   ├── storage.rules        ← Shared
 *   ├── rydeIQDriver/
 *   ├── rydeiqMobile/
 *   └── rydeIQWeb/
 * 
 * Usage: node scripts/setup-shared-folder-structure.js
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
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Paths
const RYDE_ROOT = path.resolve(__dirname, '..', '..');
const DRIVER_ROOT = path.resolve(__dirname, '..');
const MOBILE_ROOT = path.join(RYDE_ROOT, 'rydeiqMobile');
const WEB_ROOT = path.join(RYDE_ROOT, 'rydeIQWeb');

const SHARED_FUNCTIONS = path.join(RYDE_ROOT, 'functions');
const SHARED_SCRIPTS = path.join(RYDE_ROOT, 'scripts');
const SHARED_RULES = path.join(RYDE_ROOT, 'firestore.rules');
const SHARED_INDEXES = path.join(RYDE_ROOT, 'firestore.indexes.json');
const SHARED_STORAGE = path.join(RYDE_ROOT, 'storage.rules');

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        copyDir(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  return true;
}

/**
 * Merge functions from multiple codebases
 */
function mergeFunctions() {
  log.header('Merging Functions from All Codebases');
  
  const functionSources = [
    { name: 'Driver', path: path.join(DRIVER_ROOT, 'functions', 'index.js') },
    { name: 'Web', path: path.join(WEB_ROOT, 'functions', 'index.js') }
  ];
  
  const allExports = [];
  const allCode = [];
  
  functionSources.forEach(source => {
    if (fs.existsSync(source.path)) {
      log.info(`Reading functions from ${source.name}...`);
      const content = fs.readFileSync(source.path, 'utf-8');
      
      // Extract exports
      const exportMatches = [...content.matchAll(/exports\.(\w+)\s*=/g)];
      exportMatches.forEach(match => {
        if (!allExports.includes(match[1])) {
          allExports.push(match[1]);
          log.success(`  Added: ${match[1]}`);
        } else {
          log.warning(`  Duplicate: ${match[1]} (skipping)`);
        }
      });
      
      allCode.push({
        source: source.name,
        content: content
      });
    } else {
      log.warning(`${source.name} functions not found at: ${source.path}`);
    }
  });
  
  log.success(`Total unique functions: ${allExports.length}`);
  
  return { allExports, allCode };
}

/**
 * Create shared firebase.json template
 */
function createFirebaseJsonTemplate() {
  return {
    firestore: {
      rules: "../firestore.rules",
      indexes: "../firestore.indexes.json"
    },
    storage: {
      rules: "../storage.rules"
    },
    functions: [
      {
        source: "../functions",
        codebase: "default",
        ignore: [
          "node_modules",
          ".git",
          "firebase-debug.log",
          "firebase-debug.*.log"
        ]
      }
    ],
    emulators: {
      auth: {
        port: 9099
      },
      functions: {
        port: 5001
      },
      firestore: {
        port: 8080
      },
      storage: {
        port: 9199
      },
      ui: {
        enabled: true,
        port: 4000
      }
    }
  };
}

/**
 * Main setup function
 */
async function setup() {
  console.log('');
  log.header('╔════════════════════════════════════════════════════════════╗');
  log.header('║   Setup Shared Folder Structure                           ║');
  log.header('║   AnyRyde Multi-Codebase System                            ║');
  log.header('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  log.info(`RydeIQ Root: ${RYDE_ROOT}`);
  log.info(`Driver App:  ${DRIVER_ROOT}`);
  log.info(`Mobile App:  ${MOBILE_ROOT}`);
  log.info(`Web App:     ${WEB_ROOT}`);
  console.log('');
  
  // Step 1: Create shared directories
  log.header('Step 1: Creating Shared Directories');
  
  if (!fs.existsSync(SHARED_FUNCTIONS)) {
    fs.mkdirSync(SHARED_FUNCTIONS, { recursive: true });
    log.success('Created: functions/');
  } else {
    log.info('Exists: functions/');
  }
  
  if (!fs.existsSync(SHARED_SCRIPTS)) {
    fs.mkdirSync(SHARED_SCRIPTS, { recursive: true });
    log.success('Created: scripts/');
  } else {
    log.info('Exists: scripts/');
  }
  
  // Step 2: Move/Copy functions
  log.header('Step 2: Consolidating Functions');
  
  const driverFunctions = path.join(DRIVER_ROOT, 'functions');
  if (fs.existsSync(driverFunctions)) {
    if (!fs.existsSync(path.join(SHARED_FUNCTIONS, 'index.js'))) {
      log.info('Copying functions from Driver app...');
      copyDir(driverFunctions, SHARED_FUNCTIONS);
      log.success('Functions copied to shared location');
    } else {
      log.warning('Shared functions already exist, skipping copy');
      log.info('Run merge script if you need to consolidate');
    }
  }
  
  // Step 3: Move/Copy scripts
  log.header('Step 3: Consolidating Scripts');
  
  const driverScripts = path.join(DRIVER_ROOT, 'scripts');
  if (fs.existsSync(driverScripts)) {
    if (!fs.existsSync(path.join(SHARED_SCRIPTS, 'README.md'))) {
      log.info('Copying scripts from Driver app...');
      copyDir(driverScripts, SHARED_SCRIPTS);
      log.success('Scripts copied to shared location');
    } else {
      log.warning('Shared scripts already exist, skipping copy');
    }
  }
  
  // Step 4: Move/Copy Firebase config files
  log.header('Step 4: Consolidating Firebase Config Files');
  
  // Firestore rules
  const driverRules = path.join(DRIVER_ROOT, 'firestore.rules');
  if (fs.existsSync(driverRules) && !fs.existsSync(SHARED_RULES)) {
    fs.copyFileSync(driverRules, SHARED_RULES);
    log.success('Copied: firestore.rules');
  } else if (fs.existsSync(SHARED_RULES)) {
    log.info('Exists: firestore.rules');
  }
  
  // Firestore indexes
  const driverIndexes = path.join(DRIVER_ROOT, 'firestore.indexes.json');
  if (fs.existsSync(driverIndexes) && !fs.existsSync(SHARED_INDEXES)) {
    fs.copyFileSync(driverIndexes, SHARED_INDEXES);
    log.success('Copied: firestore.indexes.json');
  } else if (fs.existsSync(SHARED_INDEXES)) {
    log.info('Exists: firestore.indexes.json');
  }
  
  // Storage rules
  const driverStorage = path.join(DRIVER_ROOT, 'storage.rules');
  if (fs.existsSync(driverStorage) && !fs.existsSync(SHARED_STORAGE)) {
    fs.copyFileSync(driverStorage, SHARED_STORAGE);
    log.success('Copied: storage.rules');
  } else if (fs.existsSync(SHARED_STORAGE)) {
    log.info('Exists: storage.rules');
  }
  
  // Step 5: Create firebase.json templates
  log.header('Step 5: Creating firebase.json Templates');
  
  const template = createFirebaseJsonTemplate();
  
  const firebaseJsons = [
    { name: 'Driver', path: path.join(DRIVER_ROOT, 'firebase.json.shared-template') },
    { name: 'Mobile', path: path.join(MOBILE_ROOT, 'firebase.json.shared-template') },
    { name: 'Web', path: path.join(WEB_ROOT, 'firebase.json.shared-template') }
  ];
  
  firebaseJsons.forEach(fb => {
    fs.writeFileSync(fb.path, JSON.stringify(template, null, 2));
    log.success(`Created: ${fb.name} firebase.json template`);
  });
  
  // Step 6: Create instructions
  log.header('Step 6: Creating Instructions');
  
  const instructions = `# Shared Folder Structure Setup Complete! 🎉

## 📁 Shared Folders Created

All three codebases now reference these shared folders:

\`\`\`
C:\\Users\\sjroy\\Source\\rydeIQ\\
├── functions/              ← Shared Cloud Functions
├── scripts/                ← Shared utility scripts
├── firestore.rules         ← Shared Firestore security rules
├── firestore.indexes.json  ← Shared Firestore indexes
└── storage.rules           ← Shared Storage security rules
\`\`\`

## ✅ Next Steps

### 1. Update firebase.json in Each Codebase

Replace your \`firebase.json\` with the template:

**Driver App:**
\`\`\`bash
cd C:\\Users\\sjroy\\Source\\rydeIQ\\rydeIQDriver
cp firebase.json firebase.json.backup
cp firebase.json.shared-template firebase.json
\`\`\`

**Mobile App:**
\`\`\`bash
cd C:\\Users\\sjroy\\Source\\rydeIQ\\rydeiqMobile
cp firebase.json firebase.json.backup
cp firebase.json.shared-template firebase.json
\`\`\`

**Web App:**
\`\`\`bash
cd C:\\Users\\sjroy\\Source\\rydeIQ\\rydeIQWeb
cp firebase.json firebase.json.backup
cp firebase.json.shared-template firebase.json
\`\`\`

### 2. Remove Old Local Copies (Optional)

After confirming everything works, you can remove the local copies:

\`\`\`bash
# In each codebase (AFTER confirming shared setup works):
rm -rf functions/     # Remove local functions
rm -rf scripts/       # Remove local scripts (keep codebase-specific ones)
rm firestore.rules    # Remove local rules
rm firestore.indexes.json
rm storage.rules
\`\`\`

### 3. Deploy from Any Codebase

Now you can deploy from ANY codebase and all functions/rules deploy:

\`\`\`bash
# From Driver, Mobile, OR Web:
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only storage
\`\`\`

### 4. Add to .gitignore (Optional)

If you remove local copies, update .gitignore in each codebase:

\`\`\`
# Use shared folders (don't track locally)
/functions/
/scripts/
firestore.rules
firestore.indexes.json
storage.rules
\`\`\`

## 🔄 Daily Workflow

### Adding a New Function

\`\`\`bash
# Edit the shared file
code C:\\Users\\sjroy\\Source\\rydeIQ\\functions\\index.js

# Deploy from ANY codebase
cd rydeIQDriver  # or rydeiqMobile or rydeIQWeb
firebase deploy --only functions
\`\`\`

### Updating Firestore Rules

\`\`\`bash
# Edit the shared file
code C:\\Users\\sjroy\\Source\\rydeIQ\\firestore.rules

# Deploy from ANY codebase
firebase deploy --only firestore
\`\`\`

### Running Scripts

\`\`\`bash
# Run from ANY codebase
node ../scripts/migrate-video-recording-capability.js
\`\`\`

## ✨ Benefits

✅ **Single source of truth** - One set of functions/rules  
✅ **No sync needed** - All codebases reference same files  
✅ **Deploy from anywhere** - Any codebase can deploy  
✅ **Instant updates** - Change once, all see it  
✅ **No duplication** - No copying files around  
✅ **Team friendly** - Everyone works on same files  

## 🧪 Testing

Test that it works:

\`\`\`bash
# From Driver app
cd rydeIQDriver
firebase emulators:start

# From Mobile app (in another terminal)
cd rydeiqMobile
firebase emulators:start

# Both should use the same functions!
\`\`\`

## 📝 Notes

- Keep codebase-specific scripts in local \`scripts/\` folders
- Shared scripts go in \`C:\\Users\\sjroy\\Source\\rydeIQ\\scripts\`
- Firebase automatically resolves relative paths
- All three codebases can deploy simultaneously (though not recommended)

---

**Setup Complete!** Your multi-codebase system is now consolidated. 🎉
`;

  const instructionsPath = path.join(RYDE_ROOT, 'SHARED_FOLDER_SETUP_COMPLETE.md');
  fs.writeFileSync(instructionsPath, instructions);
  log.success('Created: SHARED_FOLDER_SETUP_COMPLETE.md');
  
  // Summary
  console.log('');
  log.header('📊 Setup Summary');
  console.log('');
  log.success(`Shared functions: ${SHARED_FUNCTIONS}`);
  log.success(`Shared scripts:   ${SHARED_SCRIPTS}`);
  log.success(`Shared rules:     ${SHARED_RULES}`);
  log.success(`Shared indexes:   ${SHARED_INDEXES}`);
  log.success(`Shared storage:   ${SHARED_STORAGE}`);
  console.log('');
  log.info('Next: Read SHARED_FOLDER_SETUP_COMPLETE.md for instructions');
  console.log('');
  log.success('Setup complete! 🎉');
  console.log('');
}

// Run
setup().catch(error => {
  log.error(`Setup failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

