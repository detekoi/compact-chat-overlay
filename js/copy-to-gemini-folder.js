#!/usr/bin/env node
// Copies the latest version of the code to a folder that can be dragged into Gemini or other LLM chat.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '..');
const TARGET_DIR = path.resolve(__dirname, '../../gemini');

// Directories to exclude (hidden folders and large directories)
const EXCLUDED_DIRS = [
    '.git',
    'node_modules',
    '.vscode',
    '.idea',
    '.DS_Store',
    '.env',
    'fonts' // Exclude fonts directory when inside assets
];

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Clean target directory
console.log(`Cleaning target directory: ${TARGET_DIR}`);
const targetContents = fs.readdirSync(TARGET_DIR);
for (const item of targetContents) {
    const itemPath = path.join(TARGET_DIR, item);
    if (fs.lstatSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
        fs.unlinkSync(itemPath);
    }
}

// Copy function that excludes specified directories
function copyRecursive(source, target) {
    const stats = fs.statSync(source);
    const basename = path.basename(source);

    // Skip excluded files and directories
    if (EXCLUDED_DIRS.includes(basename)) {
        return;
    }
    // Exclude 'assets/fonts' specifically
    const relPath = path.relative(SOURCE_DIR, source);
    if (relPath === path.join('assets', 'fonts')) {
        return;
    }

    if (stats.isDirectory()) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }
        const entries = fs.readdirSync(source);
        for (const entry of entries) {
            const sourcePath = path.join(source, entry);
            const targetPath = path.join(target, entry);
            copyRecursive(sourcePath, targetPath);
        }
    } else if (stats.isFile()) {
        fs.copyFileSync(source, target);
    }
}

// Perform the copy
console.log(`Copying from ${SOURCE_DIR} to ${TARGET_DIR}`);
copyRecursive(SOURCE_DIR, TARGET_DIR);

console.log('Copy complete!');