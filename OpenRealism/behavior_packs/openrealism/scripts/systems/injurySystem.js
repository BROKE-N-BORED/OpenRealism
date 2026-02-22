import { world, system, EffectTypes, MinecraftEffectTypes } from "@minecraft/server";

class InjurySystem {
    constructor() {
        this.injuries = new Map(); // player.id -> { bleeding: 0, brokenLeg: false }

        world.afterEvents.entityHurt.subscribe(event => {
            if (event.hurtEntity.typeId === "minecraft:player") {
                this.handlePlayerHurt(event.hurtEntity, event.damageSource, event.damage);
            }
        });

        world.afterEvents.itemUse.subscribe(event => {
            this.handleHealingItems(event);
        });

        system.runInterval(() => this.tick(), 20); // 1 second
    }

    handlePlayerHurt(player, source, damage) {
        let data = this.injuries.get(player.id) || { bleeding: 0, brokenLeg: false };

        if (source.cause === "fall" && damage > 3) {
            if (Math.random() < 0.4) {
                data.brokenLeg = true;
                player.sendMessage("§c*SNAP* You broke your leg!");
                // playSound is not universally available in this exact signature on all api versions,
                // but standard dimension.playSound might be. Usually safe to just use runCommandAsync for sound if needed, 
                // or dimension.playSound("random.break", location)
            }
        }

        if ((source.cause === "entityAttack" || source.cause === "projectile") && damage > 2) {
            if (Math.random() < 0.3) {
                data.bleeding = Math.min(data.bleeding + 5, 20); // seconds of bleeding
                player.sendMessage("§cYou are bleeding! Use a bandage.");
            }
        }

        this.injuries.set(player.id, data);
    }

    handleHealingItems(event) {
        const { source: player, itemStack } = event;
        if (player.typeId !== "minecraft:player") return;
        
        let data = this.injuries.get(player.id);
        if (!data) return;

        if (itemStack.typeId === "openrealism:bandage" && data.bleeding > 0) {
            data.bleeding = 0;
            player.sendMessage("§aYou bandaged your wounds and stopped the bleeding.");
            this.consumeItem(player, itemStack);
        }

        if (itemStack.typeId === "openrealism:splint" && data.brokenLeg) {
            data.brokenLeg = false;
            player.sendMessage("§aYou applied a splint to your broken leg.");
            this.consumeItem(player, itemStack);
        }

        this.injuries.set(player.id, data);
    }

    consumeItem(player, itemStack) {
        if (player.getGameMode() === "creative") return;
        const eq = player.getComponent("equipment_inventory");
        if (itemStack.amount > 1) {
            itemStack.amount--;
            eq.setEquipment("mainhand", itemStack);
        } else {
            eq.setEquipment("mainhand", undefined);
        }
    }

    tick() {
        for (const player of world.getAllPlayers()) {
            let data = this.injuries.get(player.id);
            if (!data) continue;

            if (data.bleeding > 0) {
                if (system.currentTick % 40 === 0) { // Every 2 seconds
                    player.applyDamage(1, { cause: "magic" });
                    player.dimension.spawnParticle("minecraft:redstone_ore_dust_particle", player.location);
                }
                data.bleeding--;
            }

            if (data.brokenLeg) {
                player.addEffect(MinecraftEffectTypes.slowness, 40, { amplifier: 2, showParticles: false });
            }

            this.injuries.set(player.id, data);
        }
    }
}
export const injurySystem = new InjurySystem();