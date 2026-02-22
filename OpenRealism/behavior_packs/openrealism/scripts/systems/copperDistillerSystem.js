import { world, system, ItemStack, MinecraftItemTypes } from "@minecraft/server";

class CopperDistillerSystem {
    constructor() {
        this.distillers = new Map();
        
        world.afterEvents.blockPlace.subscribe((event) => {
            if (event.block.typeId === "openrealism:copper_distiller_block") {
                this.registerDistiller(event.block);
            }
        });

        // Setup interaction
        world.afterEvents.playerInteractWithBlock.subscribe((event) => {
            if (event.block.typeId === "openrealism:copper_distiller_block") {
                // Similar to ceramic purifier but yields Distilled Water
            }
        });

        system.runInterval(() => this.tick(), 40); // Less frequent checks needed
    }

    registerDistiller(block) {
        this.distillers.set(this.getLocationKey(block), {
            location: block.location,
            dimension: block.dimension,
            waterLevel: 0,
            distillingProgress: 0
        });
    }

    tick() {
        for (const [key, data] of this.distillers.entries()) {
            if (data.waterLevel > 0) {
                // Check for heat source block below
                const blockBelow = data.dimension.getBlock({
                    x: data.location.x,
                    y: data.location.y - 1,
                    z: data.location.z
                });

                if (this.isHeatSource(blockBelow)) {
                    data.distillingProgress += 40;
                    
                    // Visual feedback
                    data.dimension.spawnParticle("minecraft:campfire_smoke_particle", {
                        x: data.location.x + 0.5,
                        y: data.location.y + 1.2,
                        z: data.location.z + 0.5
                    });

                    // Completion logic...
                }
            }
        }
    }

    isHeatSource(block) {
        if (!block) return false;
        const heatBlocks = [
            "minecraft:campfire",
            "minecraft:soul_campfire",
            "minecraft:fire",
            "minecraft:magma_block",
            "minecraft:lava"
        ];
        
        // If it's a campfire, check if it's lit
        if (block.typeId === "minecraft:campfire" || block.typeId === "minecraft:soul_campfire") {
            const isExtinguished = block.permutation.getState("extinguished");
            return !isExtinguished;
        }

        return heatBlocks.includes(block.typeId);
    }

    getLocationKey(block) {
        return `${block.location.x},${block.location.y},${block.location.z},${block.dimension.id}`;
    }
}