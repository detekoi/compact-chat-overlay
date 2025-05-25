#!/bin/bash

# Simple deployment script that replaces environment variables in JS files
# Usage: ./deploy.sh

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found. Using empty values."
    BADGE_ENDPOINT_GLOBAL=""
    BADGE_ENDPOINT_CHANNEL=""
fi

# Remove existing dist directory and create fresh one
rm -rf dist
mkdir -p dist

# Copy files excluding dist directory itself
rsync -av --exclude='dist' --exclude='.git' --exclude='node_modules' --exclude='.DS_Store' . dist/

cd dist

# Replace placeholders in JavaScript files
sed -i.bak "s|{{BADGE_ENDPOINT_GLOBAL}}|${BADGE_ENDPOINT_GLOBAL}|g" js/chat.js
sed -i.bak "s|{{BADGE_ENDPOINT_CHANNEL}}|${BADGE_ENDPOINT_CHANNEL}|g" js/chat.js

# Clean up backup files
rm -f js/chat.js.bak

echo "Deployment files ready in dist/ directory"
echo "Badge endpoints configured:"
echo "  Global: ${BADGE_ENDPOINT_GLOBAL}"
echo "  Channel: ${BADGE_ENDPOINT_CHANNEL}"