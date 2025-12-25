@echo off
REM Setup Symbolic Links for Shared Firebase Backend
REM This creates junctions (Windows symlinks) that point to shared folders
REM 
REM Usage: Run this script from each codebase directory (as Administrator)
REM   cd C:\Users\sjroy\Source\rydeIQ\rydeIQDriver
REM   scripts\setup-shared-symlinks.bat
REM
REM   cd C:\Users\sjroy\Source\rydeIQ\rydeiqMobile  
REM   ..\rydeIQDriver\scripts\setup-shared-symlinks.bat
REM
REM   cd C:\Users\sjroy\Source\rydeIQ\rydeIQWeb
REM   ..\rydeIQDriver\scripts\setup-shared-symlinks.bat

echo.
echo ========================================
echo   Setup Shared Firebase Backend Links
echo   AnyRyde Multi-Codebase System
echo ========================================
echo.

REM Get current directory and shared location
set CURRENT_DIR=%CD%
set SHARED_ROOT=C:\Users\sjroy\Source\rydeIQ

echo Current directory: %CURRENT_DIR%
echo Shared location:   %SHARED_ROOT%
echo.

REM Check if we're in a valid codebase directory
if not exist "%CURRENT_DIR%\firebase.json" (
    echo ERROR: firebase.json not found in current directory
    echo Please run this script from a codebase root directory
    echo.
    pause
    exit /b 1
)

echo Step 1: Backing up existing files...
echo.

REM Backup existing files if they exist
if exist "%CURRENT_DIR%\functions" (
    if not exist "%CURRENT_DIR%\functions.backup" (
        echo Backing up: functions\ -^> functions.backup\
        move "%CURRENT_DIR%\functions" "%CURRENT_DIR%\functions.backup"
    ) else (
        echo Removing existing: functions\
        rmdir /S /Q "%CURRENT_DIR%\functions"
    )
)

if exist "%CURRENT_DIR%\firestore.rules" (
    if not exist "%CURRENT_DIR%\firestore.rules.backup" (
        echo Backing up: firestore.rules
        move "%CURRENT_DIR%\firestore.rules" "%CURRENT_DIR%\firestore.rules.backup"
    ) else (
        del "%CURRENT_DIR%\firestore.rules"
    )
)

if exist "%CURRENT_DIR%\firestore.indexes.json" (
    if not exist "%CURRENT_DIR%\firestore.indexes.json.backup" (
        echo Backing up: firestore.indexes.json
        move "%CURRENT_DIR%\firestore.indexes.json" "%CURRENT_DIR%\firestore.indexes.json.backup"
    ) else (
        del "%CURRENT_DIR%\firestore.indexes.json"
    )
)

if exist "%CURRENT_DIR%\storage.rules" (
    if not exist "%CURRENT_DIR%\storage.rules.backup" (
        echo Backing up: storage.rules
        move "%CURRENT_DIR%\storage.rules" "%CURRENT_DIR%\storage.rules.backup"
    ) else (
        del "%CURRENT_DIR%\storage.rules"
    )
)

echo.
echo Step 2: Creating symbolic links...
echo.

REM Create junctions (Windows symbolic links)
mklink /J "%CURRENT_DIR%\functions" "%SHARED_ROOT%\functions"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create functions junction
    echo Please run this script as Administrator
    echo.
    pause
    exit /b 1
)
echo Created: functions\ -^> %SHARED_ROOT%\functions

mklink "%CURRENT_DIR%\firestore.rules" "%SHARED_ROOT%\firestore.rules"
echo Created: firestore.rules -^> %SHARED_ROOT%\firestore.rules

mklink "%CURRENT_DIR%\firestore.indexes.json" "%SHARED_ROOT%\firestore.indexes.json"
echo Created: firestore.indexes.json -^> %SHARED_ROOT%\firestore.indexes.json

mklink "%CURRENT_DIR%\storage.rules" "%SHARED_ROOT%\storage.rules"
echo Created: storage.rules -^> %SHARED_ROOT%\storage.rules

echo.
echo ========================================
echo   Setup Complete! ✓
echo ========================================
echo.
echo Your codebase now uses shared Firebase backend files.
echo All changes will be reflected across all codebases.
echo.
echo Shared files location:
echo   %SHARED_ROOT%\functions\
echo   %SHARED_ROOT%\firestore.rules
echo   %SHARED_ROOT%\firestore.indexes.json
echo   %SHARED_ROOT%\storage.rules
echo.
echo Test the setup:
echo   firebase deploy --only firestore --dry-run
echo.
echo To remove symlinks (won't delete shared files):
echo   rmdir functions
echo   del firestore.rules
echo   del firestore.indexes.json
echo   del storage.rules
echo.
pause

