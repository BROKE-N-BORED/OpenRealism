import { world, system, EffectTypes, MinecraftEffectTypes } from "@minecraft/server";
import { climateManager } from "./main.js"; // Needs refactoring to export instance

class SeasonalHazards {
    constructor(climateManagerInstance) {
        this.climate = climateManagerInstance;
        
        system.runInterval(() => this.tick(), 20 * 5); // Every 5 seconds
    }

    tick() {
        const season = this.climate.getSeason();
        
        for (const player of world.getAllPlayers()) {
            switch(season) {
                case 1: // SUMMER
                    this.handleSummerHazards(player);
                    break;
                case 3: // WINTER
                    this.handleWinterHazards(player);
                    break;
                case 0: // SPRING
                    this.handleSpringHazards(player);
                    break;
            }
        }
    }

    handleSummerHazards(player) {
        // Heatstroke risk (accelerates thirst drain heavily)
        // This is handled by thirstSystem listening to TempSystem
        
        // Wildfires in dry biomes
        const isDay = world.getTimeOfDay() > 1000 && world.getTimeOfDay() < 12000;
        if (isDay && Math.random() < 0.001) {
            // Small chance to ignite top block if exposed
            const loc = player.location;
            // offset slightly
            const targetX = loc.x + (Math.random() * 20 - 10);
            const targetZ = loc.z + (Math.random() * 20 - 10);
            
            // Need a safe way to cast ray down to find surface
            // ... pseudo code for igniting grass ...
        }
    }

    handleWinterHazards(player) {
        // Thin ice breaking
        // If standing on ice without ice skates
        const loc = player.location;
        const dim = player.dimension;
        
        try {
            const blockBelow = dim.getBlock({x: loc.x, y: loc.y - 0.1, z: loc.z});
            if (blockBelow && blockBelow.typeId === "minecraft:ice") {
                const eq = player.getComponent("equipment_inventory");
                const boots = eq.getEquipment("feet");
                
                const hasSkates = boots && boots.typeId === "openrealism:ice_skates";
                
                if (!hasSkates && Math.random() < 0.1) {
                    // Ice cracks!
                    world.playSound("block.glass.break", loc);
                    blockBelow.setType("minecraft:water"); // Plunge them in
                    player.sendMessage("§cThe thin ice broke beneath you!");
                } else if (hasSkates) {
                    // Skates give speed boost on ice
                    player.addEffect(MinecraftEffectTypes.speed, 20 * 2, { amplifier: 1 });
                }
            }
        } catch (e) { }
    }
    
    handleSpringHazards(player) {
        // Allergies / Pollen
        // Random sneezing (brief slowness/blindness)
        if (Math.random() < 0.005) {
            player.sendMessage("§e*Achoo!*");
            world.playSound("mob.villager.no", player.location); // placeholder sound
            player.addEffect(MinecraftEffectTypes.slowness, 20 * 2, { amplifier: 0 });
        }
        
        // Heavy rain already handled by weather
        // Flooding would occur
    }
}