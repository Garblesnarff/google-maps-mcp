# Google Maps MCP Server Enhanced

A comprehensive Model Context Protocol (MCP) server that provides 19 powerful tools for location services, routing, visual mapping, weather, environmental data, and garden/climate planning. Built for camping trip planning, outdoor research, location analysis, gardening, and any application requiring rich geographic data.

Version 4.0.0 was a ground-up rebuild on the modern MCP SDK — every tool is reliably reachable with properly validated, named arguments. Version 4.1.0 adds 5 garden/climate tools, response caching, retry with backoff, a second HTTP transport, and a REST API layer. See [What's New in 4.1.0](#-whats-new-in-41) below.

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

### 🌱 **Garden & Climate Planning — free, no Google key needed (5 tools)**
- **Frost Dates**: Estimated last-spring / first-fall frost dates and frost-free season length, hemisphere-aware
- **Growing Degree Days**: Historical and year-to-date GDD for estimating crop development timing, plus a reference table of common crop GDD requirements
- **Soil Conditions**: Current and forecast soil temperature (0/6/18cm depth) and soil moisture, with planting-threshold guidance
- **Day Length**: Sunrise/sunset, daylight and sunshine hours, and the day-over-day daylight trend
- **Garden Climate Summary**: One-call composite — approximate USDA hardiness zone, frost dates, average annual GDD, and current soil temperature/day length

These run on the free Open-Meteo historical archive (ERA5 reanalysis) and forecast APIs — **no API key required**. All derived values (frost dates, GDD, hardiness zone) are **approximations computed from ERA5 reanalysis grid data**, not ground station observations or the official USDA hardiness zone raster (which uses 1991-2020 PRISM climatology); treat them as general planning guidance, not precision agriculture.

## 🎯 Perfect For

- **🏕️ Camping & Outdoor Planning**: Weather, terrain, and campsite research
- **🔍 Research Projects**: Location data gathering and environmental monitoring
- **🚗 Travel Applications**: Route planning with real-time traffic awareness
- **📊 Data Analysis**: Geographic data collection and visualization
- **🏢 Business Applications**: Location intelligence and market analysis

## ✨ What's New in 4.1

- **5 new garden/climate tools**: `maps_frost_dates`, `maps_growing_degree_days`, `maps_soil_conditions`, `maps_day_length`, and the composite `maps_garden_climate` — free, no Google key required, built on Open-Meteo's historical archive and forecast APIs.
- **Response caching**: successful upstream responses are cached in-memory with per-API TTLs (see [Environment Variables](#-environment-variables)) to cut latency and quota usage on repeated calls. Disable with `MAPS_MCP_NO_CACHE=1`.
- **Retry with backoff**: transient failures (HTTP 429, 5xx, network errors) are retried up to twice with exponential backoff + jitter, honoring `Retry-After` when present. Other 4xx errors fail fast, unretried.
- **Debug logging**: set `MAPS_MCP_DEBUG=1` to log one line per outbound request to stderr (method, sanitized URL, status, timing, cache state, retry count).
- **Dual transport**: the server now runs over stdio (default, for MCP clients like Claude Desktop) or streamable HTTP (`TRANSPORT=http`), for both MCP-over-HTTP and a plain REST API. See [HTTP Mode & REST API](#-http-mode--rest-api).
- **REST API layer**: `/health`, `/api/tools`, and `POST /api/tools/:name` let non-MCP consumers call any tool with plain JSON, no JSON-RPC required. Optional bearer-token auth via `MAPS_MCP_AUTH_TOKEN`.

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

Note: the weather, air quality, solar, pollen, and garden/climate tools run on the free [Open-Meteo](https://open-meteo.com/) API and need **no Google API key at all**.

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

No Google API is required for `maps_weather`, `maps_air_quality`, `maps_solar`, `maps_pollen`, or the 5 garden/climate tools (`maps_frost_dates`, `maps_growing_degree_days`, `maps_soil_conditions`, `maps_day_length`, `maps_garden_climate`) — those call Open-Meteo directly.

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

## 🌐 HTTP Mode & REST API

By default the server speaks stdio, the standard transport for MCP clients like Claude Desktop and Claude Code. Set `TRANSPORT=http` to instead run it as an HTTP server exposing both a streamable-HTTP MCP endpoint and a thin REST layer — useful for non-MCP consumers (e.g. a garden-planner app backend) that would rather POST plain JSON than speak JSON-RPC.

```bash
TRANSPORT=http PORT=3000 node dist/index.js
```

Optionally set `MAPS_MCP_AUTH_TOKEN` to require a bearer token on every route except `/health`:

```bash
TRANSPORT=http PORT=3000 MAPS_MCP_AUTH_TOKEN=your-secret node dist/index.js
```
```bash
curl -H "Authorization: Bearer your-secret" http://localhost:3000/api/tools
```

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness check — `{ status: "ok", version, tools }`. Always open, even when auth is configured. |
| `GET /api/tools` | List all registered tool names. |
| `POST /api/tools/:name` | Call a tool directly with a JSON body of arguments → `{ ok: true, data }` on success, `{ ok: false, error }` on failure. |
| `POST /mcp` | Stateless streamable-HTTP MCP transport (JSON-RPC) — one server + transport per request, no session persistence. |

**Note:** the REST layer (`/api/tools/:name`) calls tool handlers directly and **bypasses the zod schema validation** that normally runs inside `registerTool` for the stdio/MCP transports. Handlers are still defensive about malformed input and fail gracefully with a 500 rather than crashing, but REST callers are responsible for sending well-formed arguments.

## 🔧 Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GOOGLE_MAPS_API_KEY` | API key for all Google-backed tools (geocoding, places, routes, elevation, static maps, street view). Not needed for weather/air quality/solar/pollen/garden tools. | none — Google-backed tools return errors if unset |
| `TRANSPORT` | Set to `http` to run the streamable-HTTP + REST server instead of stdio. | `stdio` |
| `PORT` | Port for HTTP mode. | `3000` |
| `MAPS_MCP_AUTH_TOKEN` | If set, requires `Authorization: Bearer <token>` on all HTTP routes except `/health`. | unset — auth disabled |
| `MAPS_MCP_NO_CACHE` | Set to `1` to disable response caching entirely (useful for tests/debugging). | unset — caching enabled |
| `MAPS_MCP_DEBUG` | Set to any truthy value to log one line per outbound request to stderr (method, sanitized URL, status, timing, cache HIT/MISS, retry count). | unset — quiet |
| `GOOGLE_MAPS_IMAGE_DIR` | If set, also saves generated static map / street view images to this directory on disk (in addition to returning them inline). | unset — inline only |

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

### 🌱 **Garden & Climate Planning (Open-Meteo — no Google key needed)**
| Tool | Purpose | Key Args |
|------|---------|----------|
| `maps_frost_dates` | Estimated last-spring / first-fall frost dates, frost-free season length | `latitude`, `longitude`, `years` (5–30), `frost_threshold_c` |
| `maps_growing_degree_days` | Historical + year-to-date growing degree days for crop timing | `latitude`, `longitude`, `base_temp_c`, `upper_cap_c`, `years` (5–30) |
| `maps_soil_conditions` | Current + forecast soil temperature/moisture, planting guidance | `latitude`, `longitude`, `forecast_days` (1–7) |
| `maps_day_length` | Sunrise/sunset, daylight/sunshine hours, daylight trend | `latitude`, `longitude`, `days` (1–16) |
| `maps_garden_climate` | One-call composite: hardiness zone, frost dates, GDD, soil, day length | `latitude`, `longitude` |

**Note:** these tools are free and require no API key, but every derived value (frost dates, GDD, hardiness zone) is an **approximation from ERA5 reanalysis grid data**, not official station observations or the USDA hardiness zone map — use for general garden planning, not precision agriculture.

## 💬 Example Prompts

> "Plan a camping trip to Glacier National Park: check the weather, find campgrounds nearby, get an elevation profile of the approach trail, and show me a terrain map of the area."

> "Get me a 7-day forecast and current air quality for Yosemite Valley, then find the driving route from Sacramento avoiding tolls."

> "Show me a satellite view of this campsite and check if there's street view imagery at the trailhead."

> "What hardiness zone is my garden in, when's my average last frost, and is the soil warm enough to plant peppers?"

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
- **Native `fetch`** — no HTTP client dependency, wrapped with an in-memory TTL cache and retry-with-backoff (see [Environment Variables](#-environment-variables))
- **Dual transport**: stdio (default) or streamable HTTP + REST (`TRANSPORT=http`), sharing the same 19 tool handlers via a `name -> handler` registry
- **Modular design**, organized by tool category
- All tool responses truncated at 25,000 characters to keep context usage sane
- `readOnlyHint` annotations on all 19 tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Transform your location-based projects with comprehensive Google Maps integration! 🗺️✨
