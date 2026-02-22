import { world, system, MinecraftEffectTypes } from "@minecraft/server";

const DIET_HISTORY_SIZE = 5;

class NutritionSystem {
    constructor() {
        this.dietHistory = new Map(); // player.id -> [itemTypeId, ...]

        world.afterEvents.itemCompleteUse.subscribe(event => {
            const { source, itemStack } = event;
            if (source.typeId === "minecraft:player") {
                this.handleFoodEaten(source, itemStack.typeId);
            }
        });
    }

    handleFoodEaten(player, foodId) {
        // Ignore non-food items that trigger complete use (potions/bows/shields)
        if (foodId.includes("potion") || foodId.includes("bow") || foodId.includes("shield") || foodId.includes("bottle") || foodId.includes("canteen") || foodId.includes("salve") || foodId.includes("pack")) return;

        let history = this.dietHistory.get(player.id) || [];
        
        // Count occurrences of this exact food in recent history
        let count = history.filter(f => f === foodId).length;

        if (count >= 3) {
            // Eaten way too much of the same thing
            player.sendMessage("§cYou are sick of eating this. Your body craves a varied diet.");
            player.addEffect(MinecraftEffectTypes.hunger, 20 * 10, { amplifier: 0 });
            player.addEffect(MinecraftEffectTypes.weakness, 20 * 10, { amplifier: 0 });
        } else if (count >= 1) {
            player.sendMessage("§eYou are getting tired of eating the same food.");
        } else {
            // New food! Good nutrition
            player.addEffect(MinecraftEffectTypes.regeneration, 20 * 3, { amplifier: 0 });
            player.sendMessage("§aThat tasted great! A varied diet keeps you healthy.");
        }

        history.push(foodId);
        if (history.length > DIET_HISTORY_SIZE) {
            history.shift(); // Remove oldest
        }

        this.dietHistory.set(player.id, history);
    }
}
export const nutritionSystem = new NutritionSystem();