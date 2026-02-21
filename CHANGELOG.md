# Changelog

## [1.0.0] - 2024-02-21

### Added

- Initial release

- Thirst system with 20-point scale
- 5-tier water purification (raw → boiled → filtered → purified → distilled)
- Charcoal filter item (portable, 8 uses)
- Ceramic purifier block (stationary purification)
- Copper distiller block (advanced purification + salt production)

- Body temperature system (20-45°C range)
- Wetness system (4 levels affecting temperature change rate)
- Hypothermia stages (1-4 with progressive effects)
- Heat stroke mechanics (cumulative risk above 38°C)
- Armor insulation values (material-specific)

- 4-season cycle (24 days each, 96-day year)
- 9 climate types (polar to tropical)
- Dynamic temperature calculation (season + time + weather + elevation + local)
- Seasonal hazards (heat waves, blizzards, wildfires, monsoons)

- Medical items (ice pack, warming salve, thermometer)
- Chat commands (!thirst, !season, !climate)
- 20+ new items and blocks

### Technical

- Modular system architecture
- Event-driven updates
- Performance optimized (selective ticking)
- Full Android/Bedrock compatibility