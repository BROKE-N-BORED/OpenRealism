# OpenRealism

A complete Minecraft Bedrock Edition overhaul. Inspired by RealismCraft but expanded with deeper systems and mobile optimization.

## Features

### Core Survival Systems

**Thirst System**
- 20-point thirst scale
- 5-tier water quality (dirty → boiled → filtered → purified → distilled)
- Quality affects health risk and effectiveness
- Thirst drains faster in hot environments

**Body Temperature**
- Dynamic temperature range (20-45°C)
- Normal range: 36.5-37.5°C
- Hypothermia stages (1-4) with progressive effects
- Heat stroke mechanics with cumulative risk
- Wetness multiplier (1x-2.5x) accelerates temperature change

**Wetness Mechanics**
- 4 wetness levels: dry, damp, wet, soaked
- Rain, swimming, and sweating cause wetness
- Dries over time faster in hot/dry biomes
- Reduces armor insulation effectiveness

**Armor Insulation**
- Material-specific protection values
- Leather/Gold: warm (0.6-0.7x)
- Iron/Diamond: cold conductive (1.1-1.2x)
- Wetness dramatically reduces effectiveness

### Water Purification Tech Tree

**Tier 1: Charcoal Filter**
- Craft: Paper + Charcoal
- 8 uses per filter
- Portable purification
- 5% sickness risk

**Tier 2: Ceramic Purifier**
- Craft: 8 Bricks + Charcoal Filter
- Stationary block (place and use)
- 0% sickness risk
- 20 seconds per bottle

**Tier 3: Copper Distiller**
- Craft: 7 Copper Ingots + Bucket
- Requires heat source below
- Produces distilled water + salt
- 0% sickness + regeneration bonus

**Tier 4: Furnace Boiling**
- Emergency method
- 20% sickness risk
- Fastest method

### Environmental Simulation

**Seasonal Cycles**
- 96-day year (24 days per season)
- Spring: Mild, frequent rain, flooding
- Summer: Heat waves, drought risk, wildfires
- Fall: Early frost, strong winds
- Winter: Blizzards, frozen lakes, scarce resources

**9 Climate Types**
- Polar, Subarctic, Continental, Temperate
- Oceanic, Mediterranean, Arid, Tropical, Savanna

**Dynamic Temperature Calculation**
- Season modifiers
- Time of day (diurnal variation)
- Weather effects (rain, storms)
- Elevation (lapse rate)
- Local environment (forest, water, caves)

**Seasonal Hazards**
- Spring: Mud, flooding, pollen
- Summer: Heat waves, droughts, wildfires
- Fall: Early frost, wind
- Winter: Blizzards, thin ice

### Medical Items

**Ice Pack** - Emergency heat treatment
**Warming Salve** - Emergency cold treatment
**Thermometer** - Check temperature and environmental data

## Installation

### Android (Pocket Edition)

1. Download `OpenRealism.mcpack` from Releases
2. Open with Minecraft PE
3. Create world → Behavior Packs → Activate OpenRealism
4. Enable: Holiday Creator Features, Beta APIs

### Windows 10/11

1. Double-click `.mcpack` file
2. Minecraft auto-imports
3. Apply to world

## Quick Start

1. Find water, craft canteen (4 leather)
2. Boil dirty water in furnace (safest early)
3. Build ceramic purifier at base (mid-game)
4. Use copper distiller for best quality (late)
5. Monitor temperature - wear appropriate armor
6. Use !season and !climate commands

## Commands

- `!thirst` - Check thirst level
- `!season` - Current season info
- `!climate` - Biome climate data

## System Requirements

- Minecraft Bedrock 1.20.50+
- Beta APIs enabled
- Holiday Creator Features enabled

## Documentation

- Installation Guide
- Gameplay Guide
- API Reference
- Changelog

## License

MIT License

## Credits

Inspired by RealismCraft by SparkUniverse, but completely original implementation.
