import { world } from "@minecraft/server";
import { thirstSystem } from "./systems/thirstSystem.js";

// Register Dynamic Properties
world.afterEvents.worldInitialize.subscribe((event) => {
    try {
        const def = new DynamicPropertiesDefinition();
        // Register the thirst property as a float with a default value of 20
        def.defineNumber("or:thirst", 20);
        event.propertyRegistry.registerEntityTypeDynamicProperties(def, "minecraft:player");
        console.warn("[OpenRealism] Dynamic properties registered successfully.");
    } catch (e) {
        console.error("[OpenRealism] Failed to register dynamic properties: " + e);
    }
});

// Initialize systems
console.warn("[OpenRealism] Systems initialized.");