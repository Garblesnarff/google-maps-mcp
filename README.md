# Google Maps MCP Server Enhanced

A comprehensive Model Context Protocol (MCP) server that provides 14 powerful Google Maps tools for location services, visual mapping, weather data, and environmental information. Perfect for camping trip planning, outdoor research, location analysis, and any application requiring rich geographic data.

## 🌟 Features

### 🗺️ **Core Mapping (6 tools)**
- **Geocoding**: Convert addresses to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses  
- **Places Search**: Find businesses, landmarks, and points of interest
- **Place Details**: Get comprehensive information about specific places
- **Distance Matrix**: Calculate travel times and distances between multiple points
- **Directions**: Get detailed turn-by-turn directions with multiple travel modes

### 📸 **Visual Mapping (2 tools)**
- **Street View**: Get panoramic street-level imagery with customizable viewing angles
- **Static Maps**: Generate static map images in multiple styles (roadmap, satellite, terrain, hybrid) with markers

### 🌤️ **Environmental Data (6 tools)**
- **Weather**: Current conditions and forecasts for trip planning
- **Air Quality**: Air quality indices and pollutant data for outdoor activities
- **Solar**: Solar irradiance data for solar power planning at campsites
- **Pollen**: Pollen and allergy information for outdoor activities
- **Elevation**: Elevation data for terrain analysis
- **Enhanced Routing**: Advanced route planning with traffic awareness

## 🎯 Perfect For

- **🏕️ Camping & Outdoor Planning**: Weather, terrain, and site analysis
- **🔍 Research Projects**: Location data gathering and environmental monitoring  
- **🚗 Travel Applications**: Route planning with real-time conditions
- **📊 Data Analysis**: Geographic data collection and visualization
- **🏢 Business Applications**: Location intelligence and market analysis

## 📋 Prerequisites

- **Node.js** (v18+)
- **Google Cloud Platform Account** with billing enabled
- **Google Maps API Key** with required APIs enabled

## ⚙️ Setup

### 1. **Clone and Install**
```bash
git clone https://github.com/yourusername/google-maps-mcp-server.git
cd google-maps-mcp-server
npm install
```

### 2. **Google Cloud Setup**
Enable these APIs in [Google Cloud Console](https://console.cloud.google.com):

**Required APIs:**
- Maps JavaScript API
- Geocoding API  
- Places API
- Directions API
- Distance Matrix API
- Elevation API
- Maps Static API *(for static map images)*
- Street View Static API *(for street view images)*

**Environmental APIs (Optional but Recommended):**
- Air Quality API
- Solar API  
- Pollen API
- Weather API

### 3. **Get API Key**
1. In Google Cloud Console → APIs & Services → Credentials
2. Create API Key
3. Restrict the key to the APIs listed above (recommended for security)

### 4. **Build the Server**
```bash
npm run build
```

## 🔧 Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node", 
      "args": ["/path/to/google-maps-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 🛠️ Tool Reference

### 📍 **Location Services**
| Tool | Purpose | Example Use |
|------|---------|-------------|
| `maps_geocode` | Address → Coordinates | "Convert 'Yellowstone National Park' to lat/lng" |
| `maps_reverse_geocode` | Coordinates → Address | "What's at coordinates 44.4280, -110.5885?" |
| `maps_search_places` | Find nearby places | "Find campgrounds near Yellowstone" |
| `maps_place_details` | Detailed place info | "Get hours, reviews, contact info for a campground" |

### 🚗 **Navigation & Distance**
| Tool | Purpose | Example Use |
|------|---------|-------------|
| `maps_directions` | Turn-by-turn directions | "Driving directions from Chicago to Yellowstone" |
| `maps_distance_matrix` | Multi-point distances | "Travel times between 5 potential campsites" |
| `maps_routes` | Enhanced routing | "Optimal route avoiding traffic and tolls" |
| `maps_elevation` | Terrain elevation | "Elevation profile for hiking trail" |

### 📸 **Visual Mapping**
| Tool | Purpose | Example Use |
|------|---------|-------------|
| `maps_street_view` | Street-level imagery | "See what the campground entrance looks like" |
| `maps_static_map` | Static map images | "Satellite view of research area with markers" |

### 🌤️ **Environmental Data**
| Tool | Purpose | Example Use |
|------|---------|-------------|
| `maps_weather` | Weather forecasts | "5-day forecast for camping trip" |
| `maps_air_quality` | Air pollution data | "Air quality for outdoor activities" |
| `maps_solar` | Solar irradiance | "Solar panel potential at campsite" |
| `maps_pollen` | Allergy information | "Pollen levels for sensitive individuals" |

## 💡 Usage Examples

### **Trip Planning Workflow**
```bash
# 1. Find potential campsites
maps_search_places(query="campgrounds near Glacier National Park")

# 2. Get detailed information
maps_place_details(place_id="ChIJ...")

# 3. Check weather conditions  
maps_weather(latitude=48.7596, longitude=-113.7870, forecast_days=5)

# 4. Get visual confirmation
maps_street_view(location="Going-to-the-Sun Road entrance")
maps_static_map(center="48.7596,-113.7870", maptype="terrain", zoom=12)

# 5. Plan optimal route
maps_directions(origin="Chicago, IL", destination="Glacier National Park")
```

### **Research Documentation**
```bash
# Comprehensive location analysis
maps_geocode(address="Remote research location")
maps_elevation(locations=[{latitude: 45.123, longitude: -110.456}])
maps_air_quality(latitude=45.123, longitude=-110.456)
maps_static_map(center="45.123,-110.456", maptype="satellite", 
               markers=[{location: "45.123,-110.456", color: "red"}])
```

## 🎨 Visual Capabilities

### **Street View Options**
- **Viewing Angles**: Control heading (0-360°), pitch (-90° to 90°), field of view (10-120°)
- **Image Sizes**: Up to 640x640 pixels
- **Location Input**: Addresses or exact coordinates

### **Static Map Styles**
- **Roadmap**: Standard road map view
- **Satellite**: Aerial imagery  
- **Terrain**: Physical features and elevation
- **Hybrid**: Satellite imagery with road labels

### **Custom Markers**
- **Colors**: red, blue, green, purple, yellow, gray, orange, white
- **Labels**: A-Z, 0-9 for identification
- **Multiple Points**: Mark routes, waypoints, points of interest

## 🔒 Security Best Practices

### **API Key Security**
- ✅ Use environment variables (never commit keys to code)
- ✅ Restrict API key to only required APIs
- ✅ Set up API key restrictions (HTTP referrers, IP addresses)
- ✅ Monitor API usage in Google Cloud Console
- ✅ Rotate keys regularly

### **Usage Monitoring**
- Set up billing alerts for unexpected usage
- Monitor API quotas and rate limits
- Use Cloud Monitoring for performance tracking

## 💰 Cost Management

### **Free Tier Usage**
- Most APIs include generous free monthly quotas
- Visual APIs (Street View, Static Maps) have free usage limits
- Environmental APIs may have different pricing

### **Cost Optimization Tips**
- Cache results when appropriate (especially for static location data)
- Use batch requests (Distance Matrix) for multiple calculations
- Choose appropriate detail levels for Places API requests

## 🐛 Troubleshooting

### **Common Issues**
| Error | Cause | Solution |
|-------|-------|----------|
| `REQUEST_DENIED` | API not enabled | Enable required APIs in Google Cloud Console |
| `INVALID_REQUEST` | Missing parameters | Check required parameters for each tool |
| `OVER_QUERY_LIMIT` | Quota exceeded | Check billing and quota limits |
| `ZERO_RESULTS` | No data available | Try broader search criteria or different location |

### **Debug Mode**
```bash
export DEBUG=true
npm run dev
```

## 📊 API Quotas Reference

| API | Free Tier Limit | Rate Limit |
|-----|----------------|------------|
| Geocoding | 40,000/month | 50 QPS |
| Places Search | 2,500/month | 10 QPS |
| Directions | 2,500/month | 50 QPS |
| Street View Static | 28,000/month | 100 QPS |
| Static Maps | 28,000/month | 100 QPS |

*Check Google's current pricing for up-to-date information*

## 🚀 Running the Server

```bash
# Development mode with auto-rebuild
npm run dev

# Production mode
npm run build && npm start
```

## 🏗️ Architecture

- **TypeScript**: Full type safety and modern JS features
- **Modular Design**: Organized by functionality (handlers, tools, types)
- **Error Handling**: Comprehensive validation and error responses  
- **Extensible**: Easy to add new Google Maps APIs
- **Production Ready**: Built with reliability and performance in mind

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Use Cases

- **🏕️ Camping Trip Planning**: Weather, terrain, campground research
- **🔬 Field Research**: Environmental data collection and site analysis  
- **🚚 Logistics**: Route optimization and travel planning
- **🏡 Real Estate**: Location analysis and neighborhood research
- **📱 Mobile Apps**: Location-based services and mapping features
- **🎨 Creative Projects**: Map visualization and geographic art

Transform your location-based projects with comprehensive Google Maps integration! 🗺️✨