import { world, system } from "@minecraft/server";

// Thirst constants
const MAX_THIRST = 20;
const THIRST_DAMAGE_THRESHOLD = 6;
const TICKS_PER_CHECK = 20;
const ENVIRONMENT_CHECK_INTERVAL = 100; // Cache biome every 5 seconds to save MS/tick on mobile

// Thirst decay rates (per tick)
const DECAY_RATES = {
    DEFAULT: 0.001,
    SPRINTING: 0.003,
    HOT_BIOME: 0.002,
    HEALING: 0.005
};

class ThirstSystem {
    constructor() {
        this.playerCache = new Map(); // Store temporary data like biome multiplier
        this.setupEventListeners();
    }

    setupEventListeners() {
        world.afterEvents.playerSpawn.subscribe((event) => {
            if (event.initialSpawn) {
                this.initializePlayer(event.player);
            }
        });

        // Reset thirst on death to avoid the death loop
        world.afterEvents.entityDie.subscribe((event) => {
            if (event.deadEntity.typeId === "minecraft:player") {
                this.setThirst(event.deadEntity, MAX_THIRST);
            }
        });

        world.beforeEvents.chatSend.subscribe((event) => {
            if (event.message === "!thirst") {
                this.checkThirst(event.sender);
                event.cancel = true;
            }
        });

        system.runInterval(() => this.tick(), TICKS_PER_CHECK);
        system.runInterval(() => this.updateEnvironmentCache(), ENVIRONMENT_CHECK_INTERVAL);
    }

    initializePlayer(player) {
        // Use Dynamic Properties for persistent state instead of RAM Map
        const currentThirst = player.getDynamicProperty('or:thirst');
        if (currentThirst === undefined) {
            this.setThirst(player, MAX_THIRST);
        }
    }

    updateEnvironmentCache() {
        for (const player of world.getAllPlayers()) {
            let envMultiplier = 0;
            const biome = player.dimension.getBiome(player.location);
            if (this.isHotBiome(biome)) {
                envMultiplier += DECAY_RATES.HOT_BIOME;
            }
            this.playerCache.set(player.id, { envMultiplier });
        }
    }

    tick() {
        for (const player of world.getAllPlayers()) {
            // Don't process dead players
            if (!player.isValid() || player.getComponent('minecraft:health')?.currentValue <= 0) continue;
            
            this.processThirstDecay(player);
            this.applyEffects(player);
        }
    }

    processThirstDecay(player) {
        let currentThirst = player.getDynamicProperty('or:thirst');
        if (currentThirst === undefined) return;

        let decay = DECAY_RATES.DEFAULT;

        if (player.isSprinting) decay += DECAY_RATES.SPRINTING;

        const cache = this.playerCache.get(player.id);
        if (cache) decay += cache.envMultiplier;

        // Modern API string identifier for effects
        if (player.getEffect("regeneration")) {
            decay += DECAY_RATES.HEALING;
        }

        const newThirst = Math.max(0, currentThirst - decay);
        this.setThirst(player, newThirst);
    }

    isHotBiome(biome) {
        if (!biome) return false;
        const hotBiomes = ["desert", "badlands", "nether_wastes", "soul_sand_valley", "crimson_forest", "warped_forest"];
        return hotBiomes.includes(biome.id);
    }

    applyEffects(player) {
        const thirst = player.getDynamicProperty('or:thirst');
        if (thirst === undefined) return;

        // Dehydration damage
        if (thirst <= THIRST_DAMAGE_THRESHOLD) {
            player.applyDamage(1);
            player.onScreenDisplay.setTitle("§cDEHYDRATED!", {
                stayDuration: 20,
                fadeInDuration: 5,
                fadeOutDuration: 5
            });
        }

        // Slowness when thirsty
        if (thirst < 10) {
            player.addEffect("slowness", 40, { amplifier: 0 });
        }
    }

    setThirst(player, amount) {
        player.setDynamicProperty('or:thirst', Math.max(0, Math.min(MAX_THIRST, amount)));
    }

    addThirst(player, amount) {
        const current = player.getDynamicProperty('or:thirst') ?? MAX_THIRST;
        this.setThirst(player, current + amount);
    }

    checkThirst(player) {
        const thirst = player.getDynamicProperty('or:thirst');
        if (thirst !== undefined) {
            player.sendMessage(`§bThirst: ${Math.floor(thirst)}/20`);
        }
    }
}

export const thirstSystem = new ThirstSystem();