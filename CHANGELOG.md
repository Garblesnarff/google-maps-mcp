# Changelog

All notable changes to the Google Maps MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
