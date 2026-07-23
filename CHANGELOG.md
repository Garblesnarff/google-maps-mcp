# Changelog

All notable changes to the Google Maps MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-07-23

### Added
- Elevation profile mode for `maps_elevation`: `path` + `samples` args return sampled elevations along a route with ascent/descent totals, for hike planning
- Metadata pre-check for `maps_street_view` — checks the Street View metadata endpoint first and reports when no imagery exists at a location instead of returning a blank image
- Human-readable weather conditions in `maps_weather`, derived from WMO weather codes
- `GOOGLE_MAPS_IMAGE_DIR` environment variable to optionally also save generated static map / street view images to disk
- MCP tool annotations (`readOnlyHint`) on all 14 tools
- Smoke test suite (`npm test`) using Node's built-in test runner with mocked HTTP — no API key or network access required

### Changed
- **Breaking**: rebuilt the server on `@modelcontextprotocol/sdk` ^1.29 using `McpServer` + `registerTool` with zod-validated, named arguments. Fixes a v3.1.0 bug where 10 of the 14 tools were unreachable and arguments could bind in the wrong order
- Places tools (`maps_search_places`, `maps_place_details`) migrated from the legacy Places API to Places API (New) v1 with field masks; place details now include accessibility options, EV charging, fuel prices, editorial summary, and reviews
- `maps_directions` and `maps_distance_matrix` migrated from the legacy Directions API / Distance Matrix API to Routes API v2, since the legacy APIs are closed to new Google Cloud customers
- Static map and street view images are now returned inline to the MCP client as base64 image content instead of being written to a hardcoded download path
- API keys are stripped from all URLs included in tool responses
- All tool responses truncated at 25,000 characters
- Replaced `node-fetch` with native `fetch`

### Removed
- Committed `dist/` build output from source control
- Dead legacy entry file

### Infrastructure
- No CI, by design

## [3.1.0] - 2025-07-03

### Added
- **Unified API Request Client**: `googleApiRequest` in `src/utils/api-client.ts` to handle all Google Maps API calls with automatic API key injection, error handling, and response parsing

### Changed
- **Dynamic Handler Registry**: Replaced monolithic switch-case with a `HANDLER_MAP` system in `src/index.ts` for cleaner tool routing and easier extensibility
- **Handler File Cleanup**: Removed direct handler imports from `src/index.ts` to streamline core routing logic
- **Parameter Parsing**: Standardized argument extraction through API registry to ensure correct handler function invocation

### Removed
- Legacy switch-case routing structure from `src/index.ts`
- All individual handler function imports from `src/index.ts`

### Enhanced
- API request consistency across all services through centralized `googleApiRequest`
- Improved error handling with structured response messages and automatic JSON parsing
- Reduced code duplication by 80% in handler files through new API client
- Simplified tool addition process by centralizing registry configurations

## [3.0.0] - 2025-06-24

### Added - Visual Capabilities Release
- **New Visual Tools (2)**
  - `maps_street_view` - Get panoramic street-level imagery with customizable viewing angles
  - `maps_static_map` - Generate static map images in multiple styles (roadmap, satellite, terrain, hybrid)
- **Enhanced Architecture**
  - Added modular visual tool handlers
  - Comprehensive input validation for visual APIs
  - TypeScript interfaces for visual API responses
- **Documentation**
  - Complete visual capabilities documentation
  - Usage examples for trip planning and research
  - API quotas and cost management guidance

### Enhanced
- Updated package.json with visual capabilities keywords
- Improved error handling and validation
- Added comprehensive tool reference documentation

### Infrastructure
- Production-ready TypeScript architecture
- Modular design for easy extensibility
- Professional documentation and examples

## [2.0.0] - 2025-06-20

### Added - Environmental Data
- **Weather API Integration** - Current conditions and forecasts
- **Air Quality API** - Air pollution indices and data
- **Solar API** - Solar irradiance data for solar planning
- **Pollen API** - Allergy and pollen information
- Enhanced routing with traffic awareness

### Enhanced
- Improved tool organization and categorization
- Better error handling for API responses
- Updated documentation with environmental use cases

## [1.0.0] - 2025-06-15

### Added - Initial Release
- **Core Mapping Tools (6)**
  - `maps_geocode` - Address to coordinates conversion
  - `maps_reverse_geocode` - Coordinates to address conversion
  - `maps_search_places` - Find places and points of interest
  - `maps_place_details` - Detailed place information
  - `maps_distance_matrix` - Multi-point distance calculations
  - `maps_directions` - Turn-by-turn directions
- **Additional Tools (2)**
  - `maps_elevation` - Elevation data for locations
  - `maps_routes` - Enhanced routing capabilities
- **Foundation**
  - TypeScript implementation with full type safety
  - MCP server architecture
  - Google Maps API integration
  - Comprehensive error handling

### Infrastructure
- Node.js/TypeScript foundation
- Modular architecture for scalability
- Environment-based configuration
- Professional documentation
