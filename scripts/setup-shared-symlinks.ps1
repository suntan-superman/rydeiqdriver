# Setup Symbolic Links for Shared Firebase Backend
# This creates symbolic links that point to shared folders
# 
# Usage: Run this script from each codebase directory (as Administrator)
#   cd C:\Users\sjroy\Source\rydeIQ\rydeIQDriver
#   .\scripts\setup-shared-symlinks.ps1
#
#   cd C:\Users\sjroy\Source\rydeIQ\rydeiqMobile  
#   ..\rydeIQDriver\scripts\setup-shared-symlinks.ps1
#
#   cd C:\Users\sjroy\Source\rydeIQ\rydeIQWeb
#   ..\rydeIQDriver\scripts\setup-shared-symlinks.ps1

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Setup Shared Firebase Backend Links" -ForegroundColor Cyan
Write-Host "  AnyRyde Multi-Codebase System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Get current directory and shared location
$currentDir = Get-Location
$sharedRoot = "C:\Users\sjroy\Source\rydeIQ"

Write-Host "Current directory: $currentDir" -ForegroundColor White
Write-Host "Shared location:   $sharedRoot" -ForegroundColor White
Write-Host ""

# Check if we're in a valid codebase directory
if (-not (Test-Path "$currentDir\firebase.json")) {
    Write-Host "ERROR: firebase.json not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from a codebase root directory" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Backing up existing files..." -ForegroundColor Yellow
Write-Host ""

# Backup existing files if they exist
if (Test-Path "$currentDir\functions") {
    if (-not (Test-Path "$currentDir\functions.backup")) {
        Write-Host "Backing up: functions\ -> functions.backup\" -ForegroundColor Gray
        Move-Item "$currentDir\functions" "$currentDir\functions.backup"
    } else {
        Write-Host "Removing existing: functions\" -ForegroundColor Gray
        Remove-Item "$currentDir\functions" -Recurse -Force
    }
}

if (Test-Path "$currentDir\firestore.rules") {
    if (-not (Test-Path "$currentDir\firestore.rules.backup")) {
        Write-Host "Backing up: firestore.rules" -ForegroundColor Gray
        Move-Item "$currentDir\firestore.rules" "$currentDir\firestore.rules.backup"
    } else {
        Remove-Item "$currentDir\firestore.rules"
    }
}

if (Test-Path "$currentDir\firestore.indexes.json") {
    if (-not (Test-Path "$currentDir\firestore.indexes.json.backup")) {
        Write-Host "Backing up: firestore.indexes.json" -ForegroundColor Gray
        Move-Item "$currentDir\firestore.indexes.json" "$currentDir\firestore.indexes.json.backup"
    } else {
        Remove-Item "$currentDir\firestore.indexes.json"
    }
}

if (Test-Path "$currentDir\storage.rules") {
    if (-not (Test-Path "$currentDir\storage.rules.backup")) {
        Write-Host "Backing up: storage.rules" -ForegroundColor Gray
        Move-Item "$currentDir\storage.rules" "$currentDir\storage.rules.backup"
    } else {
        Remove-Item "$currentDir\storage.rules"
    }
}

Write-Host ""
Write-Host "Step 2: Creating symbolic links..." -ForegroundColor Yellow
Write-Host ""

# Create symbolic links
try {
    # Functions (directory junction)
    New-Item -ItemType Junction -Path "$currentDir\functions" -Target "$sharedRoot\functions" -Force | Out-Null
    Write-Host "Created: functions\ -> $sharedRoot\functions" -ForegroundColor Green
    
    # Firestore rules (symbolic link)
    New-Item -ItemType SymbolicLink -Path "$currentDir\firestore.rules" -Target "$sharedRoot\firestore.rules" -Force | Out-Null
    Write-Host "Created: firestore.rules -> $sharedRoot\firestore.rules" -ForegroundColor Green
    
    # Firestore indexes (symbolic link)
    New-Item -ItemType SymbolicLink -Path "$currentDir\firestore.indexes.json" -Target "$sharedRoot\firestore.indexes.json" -Force | Out-Null
    Write-Host "Created: firestore.indexes.json -> $sharedRoot\firestore.indexes.json" -ForegroundColor Green
    
    # Storage rules (symbolic link)
    New-Item -ItemType SymbolicLink -Path "$currentDir\storage.rules" -Target "$sharedRoot\storage.rules" -Force | Out-Null
    Write-Host "Created: storage.rules -> $sharedRoot\storage.rules" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to create symbolic links" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your codebase now uses shared Firebase backend files." -ForegroundColor White
Write-Host "All changes will be reflected across all codebases." -ForegroundColor White
Write-Host ""
Write-Host "Shared files location:" -ForegroundColor Yellow
Write-Host "  $sharedRoot\functions\" -ForegroundColor White
Write-Host "  $sharedRoot\firestore.rules" -ForegroundColor White
Write-Host "  $sharedRoot\firestore.indexes.json" -ForegroundColor White
Write-Host "  $sharedRoot\storage.rules" -ForegroundColor White
Write-Host ""
Write-Host "Test the setup:" -ForegroundColor Yellow
Write-Host "  firebase deploy --only firestore --dry-run" -ForegroundColor White
Write-Host ""
Write-Host "To remove symlinks:" -ForegroundColor Yellow
Write-Host "  Remove-Item functions, firestore.rules, firestore.indexes.json, storage.rules" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"