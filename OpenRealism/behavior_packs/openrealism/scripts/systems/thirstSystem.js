import { world, system, EffectTypes, MinecraftEffectTypes } from "@minecraft/server";

// Thirst constants
const MAX_THIRST = 20;
const THIRST_DAMAGE_THRESHOLD = 6; // Below this = damage
const TICKS_PER_CHECK = 20; // Check every second

// Thirst decay rates (per tick)
const DECAY_RATES = {
    DEFAULT: 0.001,
    SPRINTING: 0.003,
    HOT_BIOME: 0.002,
    HEALING: 0.005
};

class ThirstSystem {
    constructor() {
        this.playerData = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        world.afterEvents.playerSpawn.subscribe((event) => {
            this.initializePlayer(event.player);
        });

        world.beforeEvents.chatSend.subscribe((event) => {
            if (event.message === "!thirst") {
                this.checkThirst(event.sender);
                event.cancel = true;
            }
        });

        system.runInterval(() => this.tick(), TICKS_PER_CHECK);
    }

    initializePlayer(player) {
        if (!this.playerData.has(player.id)) {
            this.playerData.set(player.id, {
                thirst: MAX_THIRST,
                isDehydrated: false
            });
        }
    }

    tick() {
        for (const player of world.getAllPlayers()) {
            this.processThirstDecay(player);
            this.applyEffects(player);
        }
    }

    processThirstDecay(player) {
        const data = this.playerData.get(player.id);
        if (!data) return;

        let decay = DECAY_RATES.DEFAULT;

        // Sprinting check
        if (player.isSprinting) decay += DECAY_RATES.SPRINTING;

        // Hot biome check (desert, badlands, nether)
        const biome = player.dimension.getBiome(player.location);
        if (this.isHotBiome(biome)) decay += DECAY_RATES.HOT_BIOME;

        // Healing check (regeneration effect)
        if (player.getEffect(MinecraftEffectTypes.regeneration)) {
            decay += DECAY_RATES.HEALING;
        }

        data.thirst = Math.max(0, data.thirst - decay);
        this.playerData.set(player.id, data);
    }

    isHotBiome(biome) {
        const hotBiomes = ["desert", "badlands", "nether_wastes", "soul_sand_valley", "crimson_forest", "warped_forest"];
        return hotBiomes.includes(biome?.typeId);
    }

    applyEffects(player) {
        const data = this.playerData.get(player.id);
        if (!data) return;

        // Dehydration damage
        if (data.thirst <= THIRST_DAMAGE_THRESHOLD) {
            player.applyDamage(1);
            player.onScreenDisplay.setTitle("§cDEHYDRATED!", {
                stayDuration: 20,
                fadeInDuration: 5,
                fadeOutDuration: 5
            });
        }

        // Slowness when thirsty
        if (data.thirst < 10) {
            player.addEffect(MinecraftEffectTypes.slowness, 40, { amplifier: 0 });
        }
    }

    addThirst(player, amount) {
        const data = this.playerData.get(player.id);
        if (data) {
            data.thirst = Math.min(MAX_THIRST, data.thirst + amount);
            this.playerData.set(player.id, data);
        }
    }

    checkThirst(player) {
        const data = this.playerData.get(player.id);
        if (data) {
            player.sendMessage(`§bThirst: ${Math.floor(data.thirst)}/20`);
        }
    }
}

export const thirstSystem = new ThirstSystem();