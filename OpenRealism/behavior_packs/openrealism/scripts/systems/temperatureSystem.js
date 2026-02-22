import { world, system, EffectTypes, MinecraftEffectTypes, WeatherType } from "@minecraft/server";


// Temperature ranges (Celsius)
const TEMP = {
    FREEZING: 30.0,
    HYPOTHERMIA: 34.0,
    COLD: 35.5,
    NORMAL_MIN: 36.5,
    NORMAL_MAX: 37.5,
    HOT: 38.0,
    HYPERTHERMIA: 39.5,
    HEATSTROKE: 41.0
};

const BASE_TEMP = 37.0;

class TemperatureSystem {
    constructor() {
        this.playerData = new Map();
        
        world.afterEvents.playerSpawn.subscribe(event => {
            this.initializePlayer(event.player);
        });

        // Debug command
        world.beforeEvents.chatSend.subscribe(event => {
            if (event.message === "!temp") {
                this.checkTemp(event.sender);
                event.cancel = true;
            }
        });

        // Run every 2 seconds
        system.runInterval(() => this.tick(), 40);
    }

    initializePlayer(player) {
        if (!this.playerData.has(player.id)) {
            this.playerData.set(player.id, {
                bodyTemp: BASE_TEMP,
                wetness: 0.0 // 0.0 to 1.0
            });
        }
    }

    tick() {
        for (const player of world.getAllPlayers()) {
            this.updatePlayerTemperature(player);
            this.applyTemperatureEffects(player);
        }
    }

    updatePlayerTemperature(player) {
        const data = this.playerData.get(player.id);
        if (!data) return;

        const envTemp = this.getEnvironmentalTemperature(player);
        const insulation = this.getClothingInsulation(player);
        
        // Update wetness
        this.updateWetness(player, data);

        // Calculate target body temperature based on environment and insulation
        // This is a simplified thermodynamic model
        let targetTemp = BASE_TEMP;
        
        if (envTemp < 10) {
            // Cold environment
            targetTemp = BASE_TEMP - ((10 - envTemp) * 0.1);
            // Insulation protects against cold
            targetTemp += insulation.warmth * 0.5;
            // Wetness drastically lowers temp in cold
            targetTemp -= (data.wetness * 2.0);
        } else if (envTemp > 30) {
            // Hot environment
            targetTemp = BASE_TEMP + ((envTemp - 30) * 0.1);
            // Heavy insulation makes you hotter
            targetTemp += insulation.weight * 0.3;
        }

        // Gradual change towards target
        const diff = targetTemp - data.bodyTemp;
        // Body regulates temperature naturally, but extreme diffs overcome it
        const regulationRate = 0.05;
        
        data.bodyTemp += diff * regulationRate;

        // Save
        this.playerData.set(player.id, data);
    }

    updateWetness(player, data) {
        const isInWater = player.isInWater;
        const isRaining = world.getDimension("overworld").weather === WeatherType.Rain || 
                          world.getDimension("overworld").weather === WeatherType.Thunder;
        
        const isExposedToRain = isRaining && this.isExposedToSky(player);

        if (isInWater) {
            data.wetness = Math.min(1.0, data.wetness + 0.1);
        } else if (isExposedToRain) {
            data.wetness = Math.min(0.8, data.wetness + 0.05); // Rain doesn't soak you 100% instantly
        } else {
            // Drying off
            let dryRate = 0.02;
            
            // Dry faster near fire/heat source
            if (this.isNearHeatSource(player)) {
                dryRate = 0.1;
                // Visual feedback
                if (data.wetness > 0) {
                    player.dimension.spawnParticle("minecraft:basic_smoke_particle", player.location);
                }
            }
            
            data.wetness = Math.max(0.0, data.wetness - dryRate);
        }
    }

    getEnvironmentalTemperature(player) {
        const dim = player.dimension.id;
        
        // Base temperatures by dimension
        if (dim === "minecraft:nether") return 50.0;
        if (dim === "minecraft:the_end") return -10.0;

        // Overworld - calculate based on biome and time
        const location = player.location;
        const biome = this.getBiomeAt(player); // Note: Script API doesn't have direct biome query yet, requires workaround or mapping
        const isNight = world.getTimeOfDay() > 13000 && world.getTimeOfDay() < 23000;
        const height = location.y;
        
        let baseEnvTemp = 20.0; // Default temperate

        // Simplified Biome Temperature Mapping (Implementation requires block/feature checking in API)
        const biomeType = this.inferBiomeType(biome);
        
        switch(biomeType) {
            case "desert": baseEnvTemp = 40.0; break;
            case "snow": baseEnvTemp = -5.0; break;
            case "jungle": baseEnvTemp = 30.0; break;
            case "ocean": baseEnvTemp = 15.0; break;
            case "mountain": baseEnvTemp = 5.0; break;
        }

        // Night time cooling
        if (isNight) {
            baseEnvTemp -= (biomeType === "desert") ? 20.0 : 10.0;
        }

        // Altitude cooling (loss of 1 degree per 10 blocks above 100)
        if (height > 100) {
            baseEnvTemp -= ((height - 100) / 10);
        }

        // Local heat sources (Torches, Lava, Campfires)
        if (this.isNearHeatSource(player)) {
            baseEnvTemp += 15.0;
        }
        
        // Local cooling sources (Ice, Powder Snow)
        if (this.isNearCoolingSource(player)) {
            baseEnvTemp -= 10.0;
        }

        return baseEnvTemp;
    }

    getClothingInsulation(player) {
        const eq = player.getComponent("equipment_inventory");
        let warmth = 0;
        let weight = 0;

        const slots = ["head", "chest", "legs", "feet"];
        for (const slot of slots) {
            const item = eq.getEquipment(slot);
            if (item) {
                // Leather is warm, Iron is heavy/cold, Gold is warm, Diamond/Netherite heavy
                if (item.typeId.includes("leather")) { warmth += 1.0; weight += 0.5; }
                else if (item.typeId.includes("iron")) { warmth += 0.2; weight += 1.5; }
                else if (item.typeId.includes("gold")) { warmth += 0.8; weight += 1.0; }
                else if (item.typeId.includes("diamond")) { warmth += 0.5; weight += 2.0; }
                else if (item.typeId.includes("netherite")) { warmth += 0.5; weight += 2.5; }
                // Custom items
                else if (item.typeId === "openrealism:ice_skates") { warmth += 0.5; weight += 0.5; }
                else { warmth += 0.5; weight += 1.0; } // Default
            }
        }

        return { warmth, weight };
    }

    applyTemperatureEffects(player) {
        const data = this.playerData.get(player.id);
        if (!data) return;

        const temp = data.bodyTemp;
        let title = "";
        let color = "";

        // Hypothermia
        if (temp <= TEMP.FREEZING) {
            player.applyDamage(2, { cause: "freezing" });
            player.addEffect(MinecraftEffectTypes.slowness, 60, { amplifier: 2 });
            player.addEffect(MinecraftEffectTypes.blindness, 60, { amplifier: 0 });
            title = "FREEZING TO DEATH";
            color = "§b";
        } else if (temp <= TEMP.HYPOTHERMIA) {
            player.applyDamage(1, { cause: "freezing" });
            player.addEffect(MinecraftEffectTypes.slowness, 60, { amplifier: 1 });
            title = "HYPOTHERMIA";
            color = "§3";
        } else if (temp <= TEMP.COLD) {
            player.addEffect(MinecraftEffectTypes.slowness, 60, { amplifier: 0 });
            title = "Chilly";
            color = "§9";
        }
        
        // Hyperthermia
        else if (temp >= TEMP.HEATSTROKE) {
            player.applyDamage(2, { cause: "fireTick" }); // Simulated heat damage
            player.addEffect(MinecraftEffectTypes.nausea, 100, { amplifier: 1 });
            player.addEffect(MinecraftEffectTypes.weakness, 60, { amplifier: 2 });
            title = "HEATSTROKE";
            color = "§4";
        } else if (temp >= TEMP.HYPERTHERMIA) {
            player.applyDamage(1, { cause: "fireTick" });
            player.addEffect(MinecraftEffectTypes.nausea, 60, { amplifier: 0 });
            player.addEffect(MinecraftEffectTypes.weakness, 60, { amplifier: 1 });
            title = "HYPERTHERMIA";
            color = "§c";
        } else if (temp >= TEMP.HOT) {
            player.addEffect(MinecraftEffectTypes.weakness, 60, { amplifier: 0 });
            title = "Overheating";
            color = "§6";
        }

        // UI Feedback
        if (title !== "") {
            // Only show title occasionally to avoid spam
            if (system.currentTick % 100 === 0) {
                player.onScreenDisplay.setActionBar(`${color}${title} (${temp.toFixed(1)}°C)`);
            }
        }
    }

    isNearHeatSource(player) {
        return this.checkBlocksInRadius(player, 4, [
            "minecraft:campfire",
            "minecraft:fire",
            "minecraft:lava",
            "minecraft:magma_block",
            "minecraft:lit_furnace"
        ]);
    }

    isNearCoolingSource(player) {
        return this.checkBlocksInRadius(player, 4, [
            "minecraft:ice",
            "minecraft:packed_ice",
            "minecraft:blue_ice",
            "minecraft:powder_snow"
        ]);
    }

    checkBlocksInRadius(player, radius, blockTypes) {
        const loc = player.location;
        const dim = player.dimension;
        
        // Check a simplified bounding box around the player
        for (let x = Math.floor(loc.x - radius); x <= Math.floor(loc.x + radius); x++) {
            for (let y = Math.floor(loc.y - radius); y <= Math.floor(loc.y + radius); y++) {
                for (let z = Math.floor(loc.z - radius); z <= Math.floor(loc.z + radius); z++) {
                    try {
                        const block = dim.getBlock({x, y, z});
                        if (block && blockTypes.includes(block.typeId)) {
                            return true;
                        }
                    } catch (e) {
                        // Ignore unloaded chunks
                    }
                }
            }
        }
        return false;
    }

    isExposedToSky(player) {
        const loc = player.location;
        const dim = player.dimension;
        
        // Trace straight up
        for (let y = Math.floor(loc.y + 2); y <= 320; y += 5) {
            try {
                const block = dim.getBlock({x: loc.x, y: y, z: loc.z});
                // If we hit a solid block, not exposed
                if (block && !block.isAir && block.typeId !== "minecraft:water") {
                    return false;
                }
            } catch (e) {
                // Out of bounds or unloaded
                break;
            }
        }
        return true;
    }

    checkTemp(player) {
        const data = this.playerData.get(player.id);
        if (data) {
            player.sendMessage(`§eBody Temp: ${data.bodyTemp.toFixed(1)}°C | Wetness: ${(data.wetness * 100).toFixed(0)}%`);
        }
    }

    inferBiomeType(biomeId) {
        // Fallback categorization until specific API support is built
        // Simplified - in real implementation use biome query
        return "plains"; // Placeholder
    }
}