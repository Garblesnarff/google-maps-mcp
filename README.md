# Google Maps MCP Server Enhanced

A comprehensive Model Context Protocol (MCP) server that provides 14 powerful tools for location services, routing, visual mapping, weather, and environmental data. Built for camping trip planning, outdoor research, location analysis, and any application requiring rich geographic data.

Version 4.0.0 is a ground-up rebuild on the modern MCP SDK — every tool is now reliably reachable with properly validated, named arguments. See [What's New in 4.0.0](#-whats-new-in-40) below.

## 🌟 Features

### 📍 **Core Location Services (5 tools)**
- **Geocoding**: Convert addresses to coordinates (all matches)
- **Reverse Geocoding**: Convert coordinates to a human-readable address
- **Places Search**: Find businesses, landmarks, and points of interest (text search with optional location bias)
- **Place Details**: Rich place info — hours, contact, accessibility options, EV charging, fuel prices, editorial summary, reviews
- **Elevation**: Point elevations, or full elevation *profiles* along a path (ascent/descent totals) for hike planning

### 🚗 **Routing — Routes API v2 (3 tools)**
- **Routes**: Origin/destination/intermediates, travel mode, traffic-aware routing preference, alternatives, avoid tolls/highways/ferries
- **Directions**: Turn-by-turn steps for a single route
- **Distance Matrix**: Travel times and distances between multiple origins and destinations at once

### 🌤️ **Environmental Data — free, no Google key needed (4 tools)**
- **Weather**: Current conditions plus up to 16-day forecast, optional hourly data, human-readable conditions from WMO weather codes
- **Air Quality**: Pollutant indices for outdoor activity planning
- **Solar**: Solar irradiance data for campsite solar power planning
- **Pollen**: Pollen/allergy data (Europe and North America coverage)

### 📸 **Visual Mapping (2 tools)**
- **Static Maps**: Roadmap, satellite, terrain, or hybrid map images with custom markers, up to 1024×1024
- **Street View**: Panoramic street-level imagery with a metadata pre-check so you know before you spend a request whether imagery exists at a location

All images are returned inline to the MCP client (base64) — no more digging through a hardcoded download folder. Set `GOOGLE_MAPS_IMAGE_DIR` if you'd also like copies saved to disk.

## 🎯 Perfect For

- **🏕️ Camping & Outdoor Planning**: Weather, terrain, and campsite research
- **🔍 Research Projects**: Location data gathering and environmental monitoring
- **🚗 Travel Applications**: Route planning with real-time traffic awareness
- **📊 Data Analysis**: Geographic data collection and visualization
- **🏢 Business Applications**: Location intelligence and market analysis

## ✨ What's New in 4.0

- **Complete rebuild** on `@modelcontextprotocol/sdk` ^1.29 (`McpServer` + `registerTool`) with zod-validated, named arguments. This fixes a v3.1.0 bug where 10 of the 14 tools were unreachable and arguments could bind in the wrong order.
- **Places API (New) v1**: Places tools migrated off the legacy Places API to the new field-mask-based API. Place details now include accessibility options, EV charging, fuel prices, editorial summary, and reviews.
- **Routes API v2**: `maps_directions` and `maps_distance_matrix` migrated off the legacy Directions/Distance Matrix APIs (which are closed to new Google Cloud customers) onto Routes API v2.
- **Elevation profiles**: `maps_elevation` now supports a path-sampling mode (`path` + `samples`) with ascent/descent totals, in addition to point lookups — built for planning the approach trail on a hike.
- **Inline images**: Static maps and Street View images are returned as MCP image content instead of being saved to a hardcoded path. Optional `GOOGLE_MAPS_IMAGE_DIR` still saves a copy to disk. Street View checks the metadata endpoint first and tells you when there's no imagery for a location instead of returning a blank image.
- **API keys stripped** from every URL included in tool responses.
- **Weather conditions**: `maps_weather` now translates WMO weather codes into human-readable conditions.
- **Cleanup**: dropped `node-fetch` in favor of native `fetch`, removed the committed `dist/` output and a dead legacy entry file, all tool responses truncate at 25,000 characters, and every tool now carries MCP annotations (`readOnlyHint`).
- **Tests**: added a smoke test suite (`npm test`) using Node's built-in test runner with mocked HTTP — no API key or network access required to run it. No CI, by design.

## 📋 Prerequisites

- **Node.js** v18+
- **Google Cloud Platform account** with billing enabled (for the Google-backed tools)
- **Google Maps API key**

Note: the weather, air quality, solar, and pollen tools run on the free [Open-Meteo](https://open-meteo.com/) API and need **no Google API key at all**.

## ⚙️ Setup

### 1. Clone and Install
```bash
git clone https://github.com/Garblesnarff/google-maps-mcp.git
cd google-maps-mcp
npm install
```

### 2. Google Cloud Setup
Enable these APIs in the [Google Cloud Console](https://console.cloud.google.com) (billing account required; each has a generous free monthly tier):

- **Geocoding API**
- **Places API (New)** — note this is a separate toggle from the legacy "Places API"
- **Routes API**
- **Elevation API**
- **Maps Static API** *(for static map images)*
- **Street View Static API** *(for street view images)*

No Google API is required for `maps_weather`, `maps_air_quality`, `maps_solar`, or `maps_pollen` — those call Open-Meteo directly.

### 3. Get an API Key
1. In Google Cloud Console → APIs & Services → Credentials
2. Create an API key
3. Restrict the key to the APIs listed above (recommended)

### 4. Build
```bash
npm run build
```

### 5. Test (optional)
```bash
npm test
```
Runs against mocked HTTP responses — no API key or network access needed.

## 🔧 Client Configuration

### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": ["/absolute/path/to/google-maps-mcp/dist/index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your-key"
      }
    }
  }
}
```

### Claude Code
```bash
claude mcp add google-maps -e GOOGLE_MAPS_API_KEY=your-key -- node /absolute/path/to/google-maps-mcp/dist/index.js
```

## 🛠️ Tool Reference

### 📍 **Core Location Services**
| Tool | Purpose | Key Args |
|------|---------|----------|
| `maps_geocode` | Address → coordinates (all matches) | `address` |
| `maps_reverse_geocode` | Coordinates → address | `latitude`, `longitude` |
| `maps_search_places` | Text search for places | `query`, optional `location`/`radius`, `max_results` |
| `maps_place_details` | Rich place info | `place_id` |
| `maps_elevation` | Point elevations or a full path profile | `locations[]` **or** `path[]` + `samples` |

### 🚗 **Routing (Routes API v2)**
| Tool | Purpose | Key Args |
|------|---------|----------|
| `maps_routes` | Route with alternatives and traffic awareness | `origin`, `destination`, `intermediates[]`, `travel_mode`, `routing_preference`, `alternatives`, `avoid_tolls`/`avoid_highways`/`avoid_ferries` |
| `maps_directions` | Turn-by-turn steps for a single route | `origin`, `destination`, `travel_mode` |
| `maps_distance_matrix` | Distances/durations across multiple origins × destinations | `origins[]`, `destinations[]`, `travel_mode` |

### 🌤️ **Environmental Data (Open-Meteo — no Google key needed)**
| Tool | Purpose | Key Args |
|------|---------|----------|
| `maps_weather` | Current conditions + forecast | `latitude`, `longitude`, `forecast_days` (1–16), `include_hourly` |
| `maps_air_quality` | Air pollution indices | `latitude`, `longitude` |
| `maps_solar` | Solar irradiance | `latitude`, `longitude` |
| `maps_pollen` | Pollen/allergy data (Europe + North America) | `latitude`, `longitude` |

### 📸 **Visual Mapping**
| Tool | Purpose | Key Args |
|------|---------|----------|
| `maps_static_map` | Static map image, inline | `center`, `zoom`, `size` (≤1024×1024), `maptype`, `markers[]`, optional `save` |
| `maps_street_view` | Street-level panorama, inline | `location`, `heading`, `pitch`, `fov`, optional `save` |

## 💬 Example Prompts

> "Plan a camping trip to Glacier National Park: check the weather, find campgrounds nearby, get an elevation profile of the approach trail, and show me a terrain map of the area."

> "Get me a 7-day forecast and current air quality for Yosemite Valley, then find the driving route from Sacramento avoiding tolls."

> "Show me a satellite view of this campsite and check if there's street view imagery at the trailhead."

## 🎨 Visual Capabilities

### **Street View**
- Viewing angles: heading (0–360°), pitch (-90° to 90°), field of view (10–120°)
- Metadata pre-check reports when no imagery exists at a location, instead of returning a blank image
- Returned inline as MCP image content; optionally also saved to `GOOGLE_MAPS_IMAGE_DIR`

### **Static Maps**
- Styles: roadmap, satellite, terrain, hybrid
- Size up to 1024×1024
- Custom markers with color and label (A–Z, 0–9)
- Returned inline as MCP image content; optionally also saved to `GOOGLE_MAPS_IMAGE_DIR`

## 🔒 Security Notes

- API keys are read from the `GOOGLE_MAPS_API_KEY` environment variable — never hardcode them
- All URLs included in tool responses have API keys stripped before being returned
- Restrict your API key to the APIs listed above in the Google Cloud Console
- Set up billing alerts and monitor usage/quotas in Cloud Monitoring

## 🐛 Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `REQUEST_DENIED` | API not enabled, or wrong Places API toggle | Enable required APIs — make sure it's **Places API (New)**, not the legacy one |
| `INVALID_REQUEST` / zod validation error | Missing or malformed arguments | Check required parameters for the tool being called |
| `OVER_QUERY_LIMIT` / `RESOURCE_EXHAUSTED` | Quota exceeded | Check billing and quota limits in Cloud Console |
| `ZERO_RESULTS` | No data available | Try a broader search or a different location |
| No API key set | `GOOGLE_MAPS_API_KEY` missing | Google-backed tools require it; weather/air/solar/pollen tools don't |

## 🏗️ Architecture

- **TypeScript** throughout, built with `tsc`
- **`@modelcontextprotocol/sdk`** `McpServer` with `registerTool` and zod schemas for every tool
- **Native `fetch`** — no HTTP client dependency
- **Modular design**, organized by tool category
- All tool responses truncated at 25,000 characters to keep context usage sane
- `readOnlyHint` annotations on all 14 tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Transform your location-based projects with comprehensive Google Maps integration! 🗺️✨
