import { world, system, MinecraftEffectTypes } from "@minecraft/server";

const MAX_STAMINA = 100;

class StaminaSystem {
    constructor() {
        this.playerStamina = new Map();
        system.runInterval(() => this.tick(), 5); // 0.25 seconds for smooth drain/regen
    }

    tick() {
        for (const player of world.getAllPlayers()) {
            let stamina = this.playerStamina.get(player.id) ?? MAX_STAMINA;

            const isSprinting = player.isSprinting;
            const isSwimming = player.isInWater;
            
            const velocity = player.getVelocity();
            const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
            const isJumping = velocity.y > 0.1 && !player.isOnGround;

            if (isSprinting) {
                stamina = Math.max(0, stamina - 2.5);
            } else if (isJumping) {
                stamina = Math.max(0, stamina - 5);
            } else if (isSwimming && speed > 0.05) {
                stamina = Math.max(0, stamina - 1.5);
            } else if (speed < 0.05) {
                // Standing still regenerates fast
                stamina = Math.min(MAX_STAMINA, stamina + 3);
            } else {
                // Walking regenerates slowly
                stamina = Math.min(MAX_STAMINA, stamina + 1);
            }

            // Apply exhaustion effects
            if (stamina <= 10) {
                player.addEffect(MinecraftEffectTypes.slowness, 20, { amplifier: 1, showParticles: false });
                player.addEffect(MinecraftEffectTypes.weakness, 20, { amplifier: 0, showParticles: false });
                if (stamina === 0 && system.currentTick % 40 === 0) {
                    player.sendMessage("§cYou are completely exhausted!");
                }
            }

            this.playerStamina.set(player.id, stamina);
            
            // Display UI
            if (stamina < MAX_STAMINA && stamina <= 40 && system.currentTick % 20 === 0) {
                player.onScreenDisplay.setActionBar(`§eStamina: ${Math.floor(stamina)}%`);
            }
        }
    }
}
export const staminaSystem = new StaminaSystem();