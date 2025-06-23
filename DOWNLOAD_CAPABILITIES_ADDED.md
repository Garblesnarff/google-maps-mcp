# 📸 Enhanced Google Maps MCP Server - Download Capabilities Added

## 🎯 **New Features**

Your Google Maps MCP server now includes **image download capabilities** for both Street View and Static Maps tools!

## 🔧 **New Parameters**

Both `maps_street_view` and `maps_static_map` tools now support:

- **`download`** (boolean, optional): Set to `true` to download images locally
- **`downloadDir`** (string, optional): Custom directory for saving images (defaults to `/Users/rob/Claude/resources/maps`)

## 📁 **File Organization**

Images are automatically saved with descriptive filenames to **`/Users/rob/Claude/resources/maps`** by default:

### Street View Images:
```
streetview_{location}_h{heading}_p{pitch}_{timestamp}.jpg
```
Example: `streetview_times_square_h180_p15_2025-06-22T15-30-45.jpg`

### Static Map Images:
```
staticmap_{maptype}_{location}_z{zoom}_{timestamp}.jpg
```
Example: `staticmap_satellite_hayward_wisconsin_z15_2025-06-22T15-30-45.jpg`

## 🧪 **Testing the New Features**

### Test 1: Street View with Download
```javascript
{
  "location": "Times Square, New York City",
  "heading": 180,
  "pitch": 15,
  "download": true
}
```

### Test 2: Static Map with Download
```javascript
{
  "center": "46.0130,-91.4847",
  "maptype": "satellite",
  "zoom": 15,
  "download": true
}
```

### Test 3: Custom Download Directory
```javascript
{
  "location": "Golden Gate Bridge, San Francisco",
  "heading": 270,
  "pitch": 20,
  "fov": 60,
  "download": true,
  "downloadDir": "/Users/rob/Desktop/maps"
}
```

## 📋 **Enhanced Response Format**

When download is enabled, responses now include:

```json
{
  "image_url": "https://maps.googleapis.com/...",
  "location": "Times Square, New York City",
  "parameters": { ... },
  "description": "Street View image URL... Image downloaded to: /path/to/file.jpg",
  "download": {
    "success": true,
    "filePath": "/Users/rob/Claude/resources/maps/streetview_times_square_h180_p15_2025-06-22T15-30-45.jpg",
    "fileName": "streetview_times_square_h180_p15_2025-06-22T15-30-45.jpg",
    "fileSize": 125834
  }
}
```

## 🚀 **Build Instructions**

1. **Build the enhanced server:**
   ```bash
   cd /Users/rob/Claude/mcp-servers/google-maps-mcp
   npm run build
   ```

2. **Test the enhanced functionality:**
   ```bash
   # The server should now accept the new download parameters
   # Images will be saved to /Users/rob/Claude/resources/maps/ directory
   ```

## ✨ **Benefits**

- **No more URL clicking**: Images are automatically saved locally
- **Easy testing**: Perfect for testing your visual tools
- **Organized storage**: Descriptive filenames make images easy to find
- **Flexible**: Choose when to download vs. just get URLs
- **Custom locations**: Save to any directory you prefer
- **Integrated with Claude workspace**: Default saves to your Claude resources folder

## 🔧 **Technical Details**

- Uses existing `node-fetch` dependency for HTTP requests
- Creates download directories automatically
- Handles download errors gracefully
- Sanitizes filenames for cross-platform compatibility
- Provides detailed download metadata
- **Default location**: `/Users/rob/Claude/resources/maps`

## 🎮 **Ready to Test!**

Your enhanced Google Maps MCP server is now ready to both generate URLs **and** download images locally to your Claude resources folder. This makes testing and development much more convenient!

Try running the original test suite with `download: true` added to see the new functionality in action.
