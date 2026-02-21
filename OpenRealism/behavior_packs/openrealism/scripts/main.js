import { world } from "@minecraft/server";
import { thirstSystem } from "./systems/thirstSystem.js";

// Register Dynamic Properties using v1.8.0+ syntax
world.afterEvents.worldInitialize.subscribe((event) => {
    try {
        const propertyRegistry = event.propertyRegistry;
        propertyRegistry.registerEntityTypeDynamicProperties("minecraft:player", [
            {
                identifier: "or:thirst",
                type: "number"
            }
        ]);
        console.warn("[OpenRealism] Dynamic properties registered successfully.");
    } catch (e) {
        console.error("[OpenRealism] Failed to register dynamic properties: " + e);
    }
});

console.warn("[OpenRealism] Systems initialized.");