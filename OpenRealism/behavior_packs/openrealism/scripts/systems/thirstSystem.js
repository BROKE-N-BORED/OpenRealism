// Add to the ThirstSystem class:

processWaterConsumption(player, itemType) {
    const data = this.playerData.get(player.id);
    if (!data) return;

    let quality = this.getWaterQuality(itemType);
    let amount = 0;

    switch (quality) {
        case WATER_QUALITY.DIRTY:
            amount = 4;
            // High risk of illness
            if (Math.random() < 0.8) {
                player.addEffect(MinecraftEffectTypes.nausea, 20 * 20, { amplifier: 1 });
            }
            if (Math.random() < 0.5) {
                player.addEffect(MinecraftEffectTypes.poison, 10 * 20, { amplifier: 0 });
                player.sendMessage("§cYou drank contaminated water and feel sick...");
            }
            break;
            
        case WATER_QUALITY.PURIFIED:
            amount = 6;
            // Safe, simple rehydration
            player.sendMessage("§aRefreshing purified water.");
            break;
            
        case WATER_QUALITY.BOILED:
            amount = 6;
            // Safe, slightly warms the player
            player.sendMessage("§aWarm boiled water.");
            // Apply slight regen
            player.addEffect(MinecraftEffectTypes.regeneration, 5 * 20, { amplifier: 0 });
            // Apply warmth (Integration with Temperature System later)
            // if (temperatureSystem) temperatureSystem.addWarmth(player, 2.0);
            break;
            
        case WATER_QUALITY.DISTILLED:
            amount = 8;
            // Best quality, extra hydration
            player.sendMessage("§bPure distilled water.");
            // if (temperatureSystem) temperatureSystem.addWarmth(player, 1.0);
            break;
    }

    this.addThirst(player, amount);
}

getWaterQuality(itemType) {
    if (itemType.includes("dirty")) return WATER_QUALITY.DIRTY;
    if (itemType.includes("purified") || itemType.includes("canteen_clean")) return WATER_QUALITY.PURIFIED;
    if (itemType.includes("boiled")) return WATER_QUALITY.BOILED;
    if (itemType.includes("distilled")) return WATER_QUALITY.DISTILLED;
    return WATER_QUALITY.DIRTY;
}