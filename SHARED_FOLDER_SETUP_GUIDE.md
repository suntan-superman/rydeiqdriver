# 🔗 Shared Folder Setup Guide
*Using Symbolic Links for Multi-Codebase Firebase Backend*

## 🎯 Solution: Symbolic Links

Firebase CLI doesn't allow `../` paths for security reasons. Instead, we use **symbolic links** (symlinks) that make each codebase think the files are local, but they actually point to the shared location.

## 📁 Folder Structure

```
C:\Users\sjroy\Source\rydeIQ\
├── functions/                    ← SHARED (real location)
├── scripts/                      ← SHARED (real location)
├── firestore.rules              ← SHARED (real location)
├── firestore.indexes.json       ← SHARED (real location)
├── storage.rules                ← SHARED (real location)
│
├── rydeIQDriver/
│   ├── functions/               ← Symlink to ../functions
│   ├── firestore.rules          ← Symlink to ../firestore.rules
│   ├── firestore.indexes.json   ← Symlink to ../firestore.indexes.json
│   ├── storage.rules            ← Symlink to ../storage.rules
│   └── firebase.json            ← Points to "functions" (local symlink)
│
├── rydeiqMobile/
│   ├── functions/               ← Symlink to ../functions
│   ├── firestore.rules          ← Symlink to ../firestore.rules
│   ├── firestore.indexes.json   ← Symlink to ../firestore.indexes.json
│   ├── storage.rules            ← Symlink to ../storage.rules
│   └── firebase.json            ← Points to "functions" (local symlink)
│
└── rydeIQWeb/
    ├── functions/               ← Symlink to ../functions
    ├── firestore.rules          ← Symlink to ../firestore.rules
    ├── firestore.indexes.json   ← Symlink to ../firestore.indexes.json
    ├── storage.rules            ← Symlink to ../storage.rules
    └── firebase.json            ← Points to "functions" (local symlink)
```

## 🚀 Setup Steps

### Step 1: Copy Files to Shared Location

From `rydeIQDriver` directory:

```powershell
# Copy functions
xcopy functions C:\Users\sjroy\Source\rydeIQ\functions /E /I /Y

# Copy scripts  
xcopy scripts C:\Users\sjroy\Source\rydeIQ\scripts /E /I /Y

# Copy Firebase config files
copy firestore.rules C:\Users\sjroy\Source\rydeIQ\firestore.rules
copy firestore.indexes.json C:\Users\sjroy\Source\rydeIQ\firestore.indexes.json
copy storage.rules C:\Users\sjroy\Source\rydeIQ\storage.rules
```

### Step 2: Setup Symlinks in Driver App

```powershell
# Run as Administrator!
cd C:\Users\sjroy\Source\rydeIQ\rydeIQDriver
.\scripts\setup-shared-symlinks.ps1
```

**What it does:**
- Backs up your existing `functions/`, `firestore.rules`, etc.
- Creates symlinks that point to `C:\Users\sjroy\Source\rydeIQ\`
- Firebase CLI will see them as local files

### Step 3: Setup Symlinks in Mobile App

```powershell
# Run as Administrator!
cd C:\Users\sjroy\Source\rydeIQ\rydeiqMobile
..\rydeIQDriver\scripts\setup-shared-symlinks.ps1
```

### Step 4: Setup Symlinks in Web App

```powershell
# Run as Administrator!
cd C:\Users\sjroy\Source\rydeIQ\rydeIQWeb
..\rydeIQDriver\scripts\setup-shared-symlinks.ps1
```

### Step 5: Test the Setup

```powershell
# Test from Driver app
cd C:\Users\sjroy\Source\rydeIQ\rydeIQDriver
firebase deploy --only firestore --dry-run

# Should work! No more "../ is outside project" error
```

## ✅ How Symlinks Work

**Windows Junction** (for folders):
```
rydeIQDriver\functions → C:\Users\sjroy\Source\rydeIQ\functions
```
- Looks like a local folder to Firebase CLI
- Actually points to shared location
- Changes in either location are instant

**Symbolic Link** (for files):
```
rydeIQDriver\firestore.rules → C:\Users\sjroy\Source\rydeIQ\firestore.rules
```
- Looks like a local file to Firebase CLI
- Actually points to shared file
- Edit in any codebase, all see changes

## 🎯 Daily Workflow

### Edit Shared Functions

```powershell
# Edit the REAL file (any codebase will see changes)
code C:\Users\sjroy\Source\rydeIQ\functions\index.js

# Or edit through symlink (same result)
code C:\Users\sjroy\Source\rydeIQ\rydeIQDriver\functions\index.js
```

### Deploy from Any Codebase

```powershell
# Deploy from Driver app
cd rydeIQDriver
firebase deploy --only functions

# Or deploy from Mobile app
cd rydeiqMobile
firebase deploy --only functions

# Same result! Both use shared functions
```

## 🔍 Verify Symlinks

Check if symlinks are created correctly:

```powershell
# In Driver app directory
Get-Item functions, firestore.rules, firestore.indexes.json, storage.rules | Format-List Name, LinkType, Target
```

Should show:
```
Name     : functions
LinkType : Junction
Target   : {C:\Users\sjroy\Source\rydeIQ\functions}

Name     : firestore.rules
LinkType : SymbolicLink
Target   : {C:\Users\sjroy\Source\rydeIQ\firestore.rules}

... etc
```

## 🧹 Removing Symlinks

If you need to remove symlinks (won't delete shared files):

```powershell
# Just delete the symlink (NOT Remove-Item -Recurse!)
Remove-Item functions                  # Removes symlink only
Remove-Item firestore.rules           
Remove-Item firestore.indexes.json
Remove-Item storage.rules

# Shared files in C:\Users\sjroy\Source\rydeIQ\ are safe
```

## ⚠️ Important Notes

### DO ✅
- Edit files in shared location or through symlinks (same thing)
- Delete symlinks with simple `Remove-Item` (safe)
- Run setup script as Administrator
- Test with `--dry-run` first

### DON'T ❌
- Don't use `Remove-Item -Recurse` on symlink folders
- Don't edit `.backup` files (those are your originals)
- Don't manually copy files between codebases anymore
- Don't forget to run as Administrator

## 🐛 Troubleshooting

### "Access Denied" when creating symlinks
**Solution**: Run PowerShell as Administrator
```powershell
# Right-click PowerShell → "Run as Administrator"
```

### Symlinks not working after restart
**Solution**: Windows symlinks are permanent, but check:
```powershell
Get-Item functions | Format-List LinkType, Target
# Should show Junction/SymbolicLink
```

### Changes not appearing in other codebases
**Solution**: Check if symlinks point to correct location
```powershell
Get-Item functions, firestore.rules | Format-List Name, Target
# Target should be C:\Users\sjroy\Source\rydeIQ\...
```

### Want to go back to local files
```powershell
# Remove symlinks
Remove-Item functions, firestore.rules, firestore.indexes.json, storage.rules

# Restore backups
Move-Item functions.backup functions
Move-Item firestore.rules.backup firestore.rules
Move-Item firestore.indexes.json.backup firestore.indexes.json
Move-Item storage.rules.backup storage.rules
```

## 📊 Benefits

✅ **Single source of truth** - Edit once, deploy from anywhere  
✅ **No sync scripts needed** - Symlinks handle it automatically  
✅ **Firebase CLI compatible** - Looks like local files  
✅ **Instant updates** - Changes visible immediately  
✅ **Safe** - Deleting symlinks doesn't delete shared files  
✅ **Team friendly** - Everyone works on same files  

## 🎉 You're Done!

After setup, your workflow is simple:

1. Edit files in `C:\Users\sjroy\Source\rydeIQ\functions\` (or through any symlink)
2. Deploy from ANY codebase: `firebase deploy --only functions`
3. All codebases always in sync!

---

**Next Steps:**
1. Run Step 1 to copy files to shared location
2. Run setup script in each codebase (as Administrator)
3. Test deployment with `--dry-run`
4. Deploy and enjoy synchronized backends! 🚀

