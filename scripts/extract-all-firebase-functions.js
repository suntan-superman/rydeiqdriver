/**
 * Extract All Firebase Cloud Functions
 * 
 * This script downloads the source code of ALL deployed Cloud Functions
 * from your Firebase project and saves them to a consolidated file.
 * 
 * Usage: node scripts/extract-all-firebase-functions.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, '.firebase-sync');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').split('.')[0];

/**
 * Get list of all deployed functions
 */
function getDeployedFunctions() {
  log.info('Fetching list of deployed functions...');
  
  try {
    const result = execSync('firebase functions:list', { encoding: 'utf-8' });
    
    // Parse the output to extract function names
    const lines = result.split('\n');
    const functions = [];
    
    lines.forEach(line => {
      // Look for lines with function names (format: functionName(region))
      const match = line.match(/^[\s│├└─]+([a-zA-Z0-9_-]+)\(([a-z0-9-]+)\)/);
      if (match) {
        functions.push({
          name: match[1],
          region: match[2]
        });
      }
    });
    
    return functions;
  } catch (error) {
    log.error(`Failed to list functions: ${error.message}`);
    return [];
  }
}

/**
 * Create master functions list
 */
function createFunctionsList(functions) {
  log.header('Deployed Cloud Functions:');
  console.log('');
  
  const categories = {
    video: [],
    payment: [],
    notification: [],
    driver: [],
    ride: [],
    other: []
  };
  
  functions.forEach(fn => {
    log.info(`  ${fn.name} (${fn.region})`);
    
    // Categorize functions
    if (fn.name.includes('video') || fn.name.includes('recording') || fn.name.includes('incident')) {
      categories.video.push(fn);
    } else if (fn.name.includes('payment') || fn.name.includes('stripe') || fn.name.includes('refund')) {
      categories.payment.push(fn);
    } else if (fn.name.includes('notification') || fn.name.includes('reminder') || fn.name.includes('alert')) {
      categories.notification.push(fn);
    } else if (fn.name.includes('driver') || fn.name.includes('application')) {
      categories.driver.push(fn);
    } else if (fn.name.includes('ride') || fn.name.includes('location')) {
      categories.ride.push(fn);
    } else {
      categories.other.push(fn);
    }
  });
  
  return categories;
}

/**
 * Generate master functions template
 */
function generateMasterFunctionsFile(categories, existingFunctionsPath) {
  log.header('Generating master functions file...');
  
  // Read existing functions from current codebase
  let existingCode = '';
  if (fs.existsSync(existingFunctionsPath)) {
    existingCode = fs.readFileSync(existingFunctionsPath, 'utf-8');
  }
  
  const output = `/**
 * MASTER Cloud Functions File
 * Consolidated from all AnyRyde codebases
 * 
 * Generated: ${new Date().toISOString()}
 * Total Functions: ${Object.values(categories).flat().length}
 * 
 * Categories:
 * - Video Recording: ${categories.video.length} functions
 * - Payments: ${categories.payment.length} functions  
 * - Notifications: ${categories.notification.length} functions
 * - Driver Management: ${categories.driver.length} functions
 * - Ride Management: ${categories.ride.length} functions
 * - Other: ${categories.other.length} functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
admin.initializeApp();

const db = admin.firestore();

// ============================================
// VIDEO RECORDING FUNCTIONS
// From: rydeIQDriver codebase
// ============================================

${categories.video.map(fn => `
// TODO: Add implementation for ${fn.name}
// exports.${fn.name} = functions...
`).join('\n')}

// ============================================
// PAYMENT FUNCTIONS  
// From: Payment/Stripe codebase
// ============================================

${categories.payment.map(fn => `
// TODO: Add implementation for ${fn.name}
// exports.${fn.name} = functions...
`).join('\n')}

// ============================================
// NOTIFICATION FUNCTIONS
// From: Notification codebase
// ============================================

${categories.notification.map(fn => `
// TODO: Add implementation for ${fn.name}
// exports.${fn.name} = functions...
`).join('\n')}

// ============================================
// DRIVER MANAGEMENT FUNCTIONS
// ============================================

${categories.driver.map(fn => `
// TODO: Add implementation for ${fn.name}
// exports.${fn.name} = functions...
`).join('\n')}

// ============================================
// RIDE MANAGEMENT FUNCTIONS
// ============================================

${categories.ride.map(fn => `
// TODO: Add implementation for ${fn.name}
// exports.${fn.name} = functions...
`).join('\n')}

// ============================================
// OTHER FUNCTIONS
// ============================================

${categories.other.map(fn => `
// TODO: Add implementation for ${fn.name}
// exports.${fn.name} = functions...
`).join('\n')}

// ============================================
// CURRENT CODEBASE FUNCTIONS (AUTO-INCLUDED)
// ============================================

${existingCode.includes('exports.') ? '// Existing functions from current codebase are below:\n' : ''}
`;

  return output;
}

/**
 * Create instructions file
 */
function createInstructions(categories) {
  const instructions = `# Firebase Functions Consolidation Guide

Generated: ${new Date().toISOString()}

## 📊 Current State

You have **${Object.values(categories).flat().length} functions** deployed across 3 codebases:

### Video Recording Functions (${categories.video.length})
${categories.video.map(fn => `- ${fn.name}`).join('\n')}

### Payment Functions (${categories.payment.length})
${categories.payment.map(fn => `- ${fn.name}`).join('\n')}

### Notification Functions (${categories.notification.length})
${categories.notification.map(fn => `- ${fn.name}`).join('\n')}

### Driver Management Functions (${categories.driver.length})
${categories.driver.map(fn => `- ${fn.name}`).join('\n')}

### Ride Management Functions (${categories.ride.length})
${categories.ride.map(fn => `- ${fn.name}`).join('\n')}

### Other Functions (${categories.other.length})
${categories.other.map(fn => `- ${fn.name}`).join('\n')}

---

## 🔄 Consolidation Steps

### Step 1: Gather Source Code from Each Codebase

**Codebase A (rydeIQDriver):**
\`\`\`bash
cd /path/to/rydeIQDriver/functions
cp index.js ${OUTPUT_DIR}/codebase-a-functions.js
cp package.json ${OUTPUT_DIR}/codebase-a-package.json
\`\`\`

**Codebase B (Payments/Stripe):**
\`\`\`bash
cd /path/to/codebase-b/functions
cp index.js ${OUTPUT_DIR}/codebase-b-functions.js
cp package.json ${OUTPUT_DIR}/codebase-b-package.json
\`\`\`

**Codebase C (Scheduling/Notifications):**
\`\`\`bash
cd /path/to/codebase-c/functions
cp index.js ${OUTPUT_DIR}/codebase-c-functions.js
cp package.json ${OUTPUT_DIR}/codebase-c-package.json
\`\`\`

---

### Step 2: Merge into Master Functions File

Run the merge script:
\`\`\`bash
node scripts/merge-firebase-functions.js
\`\`\`

This will create: \`functions/index-master.js\`

---

### Step 3: Review and Test

1. Review the merged \`index-master.js\` file
2. Check for duplicate function names
3. Resolve any conflicts
4. Test locally:
   \`\`\`bash
   cd functions
   npm install
   firebase emulators:start --only functions
   \`\`\`

---

### Step 4: Deploy Master File

\`\`\`bash
# Backup existing functions
cp functions/index.js functions/index.backup.js

# Use master file
cp functions/index-master.js functions/index.js

# Deploy
firebase deploy --only functions
\`\`\`

---

### Step 5: Update All Codebases

Copy the master \`functions/index.js\` to all 3 codebases:

\`\`\`bash
# Copy to Codebase A
cp functions/index.js /path/to/codebase-a/functions/index.js

# Copy to Codebase B
cp functions/index.js /path/to/codebase-b/functions/index.js

# Copy to Codebase C
cp functions/index.js /path/to/codebase-c/functions/index.js
\`\`\`

Now all 3 codebases have the same functions!

---

## 📦 Package.json Dependencies

Make sure all codebases use the same dependencies:

\`\`\`json
{
  "engines": { "node": ">=18" },
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.9.0",
    "stripe": "^14.0.0"  // If using Stripe
  }
}
\`\`\`

---

## 🔐 Environment Variables

If functions use environment variables, set them:

\`\`\`bash
firebase functions:config:set stripe.secret="sk_test_..."
firebase functions:config:set sendgrid.key="SG...."
\`\`\`

---

## ✅ Verification Checklist

After consolidation:
- [ ] All ${Object.values(categories).flat().length} functions present in master file
- [ ] No duplicate function names
- [ ] All dependencies in package.json
- [ ] Environment variables configured
- [ ] Local emulator testing successful
- [ ] Deployed to Firebase successfully
- [ ] All 3 codebases updated with master file
- [ ] All features working as expected

---

## 🆘 Troubleshooting

**Issue**: Function not found after deployment
- Check the function name matches exactly
- Verify it's exported: \`exports.functionName = ...\`
- Check Cloud Functions logs

**Issue**: Dependency conflicts
- Ensure all package.json files use same versions
- Run \`npm install\` in each codebase

**Issue**: Environment variables missing
- Run \`firebase functions:config:get\` to see current config
- Set missing variables with \`firebase functions:config:set\`

---

## 📞 Support

For issues, check:
- Cloud Functions logs: \`firebase functions:log\`
- Firebase Console: https://console.firebase.google.com
- This consolidation was generated on: ${new Date().toISOString()}
`;

  return instructions;
}

/**
 * Main execution
 */
function main() {
  console.log('');
  log.header('╔════════════════════════════════════════════════════════════╗');
  log.header('║   Extract All Firebase Cloud Functions                    ║');
  log.header('║   AnyRyde Multi-Codebase Sync                              ║');
  log.header('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Get all deployed functions
  const functions = getDeployedFunctions();
  
  if (functions.length === 0) {
    log.error('No functions found or unable to fetch function list');
    log.info('Make sure you are logged in: firebase login');
    log.info('Make sure you have selected a project: firebase use <project-id>');
    return;
  }
  
  log.success(`Found ${functions.length} deployed functions`);
  
  // Categorize functions
  const categories = createFunctionsList(functions);
  
  // Generate master template
  const existingFunctionsPath = path.join(PROJECT_ROOT, 'functions', 'index.js');
  const masterTemplate = generateMasterFunctionsFile(categories, existingFunctionsPath);
  
  // Save template
  const templatePath = path.join(OUTPUT_DIR, `functions-template-${TIMESTAMP}.js`);
  fs.writeFileSync(templatePath, masterTemplate);
  log.success(`Master template saved: ${templatePath}`);
  
  // Create instructions
  const instructions = createInstructions(categories);
  const instructionsPath = path.join(OUTPUT_DIR, `CONSOLIDATION_INSTRUCTIONS.md`);
  fs.writeFileSync(instructionsPath, instructions);
  log.success(`Instructions saved: ${instructionsPath}`);
  
  // Create function list JSON
  const functionsJson = {
    generated: new Date().toISOString(),
    totalFunctions: functions.length,
    categories: {
      video: categories.video.map(f => f.name),
      payment: categories.payment.map(f => f.name),
      notification: categories.notification.map(f => f.name),
      driver: categories.driver.map(f => f.name),
      ride: categories.ride.map(f => f.name),
      other: categories.other.map(f => f.name)
    },
    allFunctions: functions
  };
  
  const jsonPath = path.join(OUTPUT_DIR, `functions-list-${TIMESTAMP}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(functionsJson, null, 2));
  log.success(`Function list JSON saved: ${jsonPath}`);
  
  // Summary
  console.log('');
  log.header('📦 Files Generated:');
  log.info(`  1. Template: ${path.basename(templatePath)}`);
  log.info(`  2. Instructions: ${path.basename(instructionsPath)}`);
  log.info(`  3. Function List: ${path.basename(jsonPath)}`);
  console.log('');
  log.header('📝 Next Steps:');
  log.info('  1. Read the instructions: .firebase-sync/CONSOLIDATION_INSTRUCTIONS.md');
  log.info('  2. Gather functions from all 3 codebases');
  log.info('  3. Run: node scripts/merge-firebase-functions.js');
  log.info('  4. Review and deploy the master functions file');
  console.log('');
  log.success('Extraction complete!');
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

