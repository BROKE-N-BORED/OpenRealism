import { world, system, ItemStack, MinecraftItemTypes } from "@minecraft/server";
import { thirstSystem } from "./thirstSystem.js";

// Constants
const PURIFICATION_TICKS = 20 * 30; // 30 seconds to purify one block/item of water
const MAX_WATER_CAPACITY = 3; // Bottles worth

class WaterPurificationSystem {
    constructor() {
        this.purifiers = new Map(); // Store active purifiers
        this.setupEventListeners();
        
        // Start ticking
        system.runInterval(() => this.tick(), 20); // Check every second
    }

    setupEventListeners() {
        // Listen for block placement (Ceramic Purifier)
        world.afterEvents.blockPlace.subscribe((event) => {
            if (event.block.typeId === "openrealism:ceramic_purifier_block") {
                this.registerPurifier(event.block);
            }
        });

        // Listen for block breaking
        world.afterEvents.blockBreak.subscribe((event) => {
            if (event.brokenBlockPermutation.type.id === "openrealism:ceramic_purifier_block") {
                this.unregisterPurifier(event.block);
            }
        });

        // Listen for player interactions with the purifier
        world.afterEvents.playerInteractWithBlock.subscribe((event) => {
            if (event.block.typeId === "openrealism:ceramic_purifier_block") {
                this.handlePurifierInteraction(event.player, event.block, event.itemStack);
            }
        });
    }

    registerPurifier(block) {
        const key = this.getLocationKey(block);
        this.purifiers.set(key, {
            location: block.location,
            waterLevel: 0, // 0 to MAX_WATER_CAPACITY
            isDirty: false,
            hasFilter: false,
            filterUses: 0,
            purifyingProgress: 0
        });
    }

    unregisterPurifier(block) {
        const key = this.getLocationKey(block);
        this.purifiers.delete(key);
    }

    handlePurifierInteraction(player, block, itemStack) {
        const key = this.getLocationKey(block);
        let purifierData = this.purifiers.get(key);
        
        // If placed before system was running, register it now
        if (!purifierData) {
            this.registerPurifier(block);
            purifierData = this.purifiers.get(key);
        }

        if (!itemStack) return;

        // 1. Adding a filter
        if (itemStack.typeId === "openrealism:charcoal_filter") {
            if (!purifierData.hasFilter) {
                purifierData.hasFilter = true;
                purifierData.filterUses = 8; // Filter durability
                
                // Consume filter
                if (player.getGameMode() !== "creative") {
                    const equipment = player.getComponent("equipment_inventory");
                    itemStack.amount--;
                    if (itemStack.amount <= 0) {
                        equipment.setEquipment("mainhand", undefined);
                    } else {
                        equipment.setEquipment("mainhand", itemStack);
                    }
                }
                
                player.sendMessage("§aCharcoal filter installed.");
                world.playSound("insert.filter", block.location);
            } else {
                player.sendMessage("§cPurifier already has a filter.");
            }
            return;
        }

        // 2. Adding dirty water
        if (itemStack.typeId === "minecraft:water_bucket" || itemStack.typeId === "openrealism:dirty_water_bottle") {
            if (purifierData.waterLevel < MAX_WATER_CAPACITY) {
                const amountToAdd = itemStack.typeId === "minecraft:water_bucket" ? 3 : 1;
                
                if (purifierData.waterLevel + amountToAdd <= MAX_WATER_CAPACITY) {
                    purifierData.waterLevel += amountToAdd;
                    purifierData.isDirty = true;
                    purifierData.purifyingProgress = 0; // Reset progress
                    
                    // Replace item with empty variant
                    if (player.getGameMode() !== "creative") {
                        const emptyItem = itemStack.typeId === "minecraft:water_bucket" ? 
                            new ItemStack(MinecraftItemTypes.bucket, 1) : 
                            new ItemStack(MinecraftItemTypes.glassBottle, 1);
                            
                        const equipment = player.getComponent("equipment_inventory");
                        equipment.setEquipment("mainhand", emptyItem);
                    }
                    
                    world.playSound("bucket.empty_water", block.location);
                } else {
                    player.sendMessage("§cPurifier is full.");
                }
            }
            return;
        }

        // 3. Collecting purified water
        if (itemStack.typeId === "minecraft:glass_bottle" || itemStack.typeId === "openrealism:canteen_empty") {
            if (purifierData.waterLevel > 0 && !purifierData.isDirty) {
                const amountNeeded = itemStack.typeId === "openrealism:canteen_empty" ? 3 : 1;
                
                if (purifierData.waterLevel >= amountNeeded) {
                    purifierData.waterLevel -= amountNeeded;
                    
                    // Give purified water
                    if (player.getGameMode() !== "creative") {
                        const filledItem = itemStack.typeId === "openrealism:canteen_empty" ? 
                            new ItemStack("openrealism:canteen_clean", 1) : 
                            new ItemStack("openrealism:purified_water_bottle", 1);
                            
                        const equipment = player.getComponent("equipment_inventory");
                        itemStack.amount--;
                        
                        if (itemStack.amount <= 0) {
                            equipment.setEquipment("mainhand", filledItem);
                        } else {
                            equipment.setEquipment("mainhand", itemStack);
                            // Need to handle inventory full case here in full implementation
                            player.getComponent("inventory").container.addItem(filledItem);
                        }
                    }
                    
                    world.playSound("bottle.fill", block.location);
                } else {
                    player.sendMessage("§cNot enough purified water.");
                }
            } else if (purifierData.waterLevel > 0 && purifierData.isDirty) {
                player.sendMessage("§cWater is still purifying...");
            } else {
                player.sendMessage("§cPurifier is empty.");
            }
            return;
        }
        
        // 4. Checking status (Empty hand interaction)
        player.sendMessage(`§ePurifier Status:`);
        player.sendMessage(`Water Level: ${purifierData.waterLevel}/${MAX_WATER_CAPACITY}`);
        player.sendMessage(`Status: ${purifierData.waterLevel === 0 ? "Empty" : (purifierData.isDirty ? "Purifying..." : "Clean")}`);
        player.sendMessage(`Filter: ${purifierData.hasFilter ? purifierData.filterUses + " uses left" : "None installed"}`);
    }

    tick() {
        for (const [key, data] of this.purifiers.entries()) {
            // Process purifying logic
            if (data.waterLevel > 0 && data.isDirty && data.hasFilter) {
                data.purifyingProgress += 20; // We check every 20 ticks (1 second)
                
                // Spawn particles to indicate it's working
                const dim = world.getDimension("overworld");
                dim.spawnParticle("minecraft:water_drip_particle", {
                    x: data.location.x + 0.5,
                    y: data.location.y + 0.1,
                    z: data.location.z + 0.5
                });

                if (data.purifyingProgress >= PURIFICATION_TICKS) {
                    // Purification complete
                    data.isDirty = false;
                    data.purifyingProgress = 0;
                    
                    // Consume filter durability
                    data.filterUses--;
                    if (data.filterUses <= 0) {
                        data.hasFilter = false;
                        // Optional: Play a "filter broke" sound
                    }
                }
            }
        }
    }

    getLocationKey(block) {
        return `${block.location.x},${block.location.y},${block.location.z}`;
    }
}