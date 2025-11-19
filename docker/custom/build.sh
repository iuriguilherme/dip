#!/bin/bash

# Build script for custom n8n node
# This compiles TypeScript to JavaScript

set -e

echo "Building custom n8n node..."

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build complete! Files are in dist/ folder"
ls -lh dist/nodes
ls -lh dist/nodes/*/
