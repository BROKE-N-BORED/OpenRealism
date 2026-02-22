import { world, system, WeatherType } from "@minecraft/server";
import { temperatureSystem } from "./temperatureSystem.js";
import { thirstSystem } from "./thirstSystem.js";

// Helper system to run expensive environmental checks less frequently
class EnvironmentTracker {
    constructor() {
        this.playerEnvironments = new Map();
        
        // Run every 20 ticks (1 second)
        system.runInterval(() => this.tick(), 20);
    }

    tick() {
        const isRaining = world.getDimension("overworld").weather === WeatherType.Rain || 
                          world.getDimension("overworld").weather === WeatherType.Thunder;
                          
        for (const player of world.getAllPlayers()) {
            // Catch rain water with canteen functionality
            this.handleRainCatching(player, isRaining);
            
            // Check for shade in desert
            this.handleDesertShade(player);
        }
    }

    handleRainCatching(player, isRaining) {
        if (!isRaining) return;

        // Player must be holding an empty or partially full container and be looking up
        const viewDir = player.getViewDirection();
        if (viewDir.y > 0.5) { // Looking upwards
            
            // We need exposed sky
            if (!this.isExposedToSky(player)) return;

            const equipment = player.getComponent("equipment_inventory");
            if (!equipment) return;
            
            const mainhand = equipment.getEquipment("mainhand");
            if (!mainhand) return;

            // Simple catch logic: Random chance per second to catch some rain
            if (Math.random() < 0.1) { 
                if (mainhand.typeId === "minecraft:glass_bottle") {
                    player.sendMessage("§bCaught some rain water!");
                    // Swap to dirty water (rain water still needs boiling in hardcore survival)
                    // Logic to swap item...
                }
            }
        }
    }

    handleDesertShade(player) {
        // If in desert (inferred by temp system) and exposed to sky, increase thirst drain
        // If in shade, reduce temperature impact
        // Implementation relies on temperatureSystem's inferBiomeType
    }
    
    isExposedToSky(player) {
        const loc = player.location;
        const dim = player.dimension;
        for (let y = Math.floor(loc.y + 2); y <= 320; y += 10) {
            try {
                const block = dim.getBlock({x: loc.x, y: y, z: loc.z});
                if (block && !block.isAir) return false;
            } catch (e) {
                break;
            }
        }
        return true;
    }
}