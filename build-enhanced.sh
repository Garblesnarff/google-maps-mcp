#!/bin/bash

# Build script for Google Maps MCP Server with download capabilities
cd "/Users/rob/Claude/mcp-servers/google-maps-mcp"

echo "Building TypeScript files..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "Enhanced Google Maps MCP server with download capabilities is ready."
    echo ""
    echo "New features added:"
    echo "- Image download functionality for Street View and Static Maps"
    echo "- Optional 'download' parameter (true/false)"
    echo "- Optional 'downloadDir' parameter for custom save location"
    echo "- Enhanced metadata with download information"
    echo "- Images saved with descriptive filenames"
    echo ""
    echo "Images will be saved to: /Users/rob/Claude/resources/maps/ (or custom directory)"
    echo ""
    echo "The resources/maps directory has been created and is ready for use."
else
    echo "❌ Build failed. Please check the TypeScript compilation errors above."
fi
