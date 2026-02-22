import { world, system } from "@minecraft/server";

// Season constants (Minecraft days)
const SEASON_LENGTH = 14; // 14 in-game days per season
const SEASO = {
    SPRING: 0,
    SUMMER: 1,
    AUTUMN: 2,
    WINTER: 3
};

const SEASON_NAMES = ["Spring", "Summer", "Autumn", "Winter"];

class ClimateManager {
    constructor() {
        this.currentDay = 0;
        this.currentSeason = SEASO.SPRING;
        
        // Load saved state if exists via dynamic properties
        this.loadState();
        
        // Track time daily
        system.runInterval(() => this.checkTime(), 200); // Check every 10 seconds
        
        // Chat commands for testing
        world.beforeEvents.chatSend.subscribe(event => {
            if (event.message === "!season") {
                this.displaySeasonInfo(event.sender);
                event.cancel = true;
            } else if (event.message.startsWith("!setseason")) {
                const parts = event.message.split(" ");
                if (parts[1]) {
                    this.setSeason(parseInt(parts[1]));
                    event.cancel = true;
                }
            }
        });
    }

    loadState() {
        const savedDay = world.getDynamicProperty("openrealism:current_day");
        if (savedDay !== undefined) {
            this.currentDay = savedDay;
            this.calculateSeason();
        }
    }

    saveState() {
        world.setDynamicProperty("openrealism:current_day", this.currentDay);
    }

    checkTime() {
        const absoluteTime = world.getAbsoluteTime();
        // 24000 ticks = 1 in-game day
        const dayCalc = Math.floor(absoluteTime / 24000);
        
        if (dayCalc > this.currentDay) {
            this.currentDay = dayCalc;
            this.saveState();
            
            const previousSeason = this.currentSeason;
            this.calculateSeason();
            
            if (this.currentSeason !== previousSeason) {
                this.announceSeasonChange();
                this.applySeasonalWorldChanges();
            }
        }
    }

    calculateSeason() {
        // e.g., Day 0-13 = Spring, 14-27 = Summer, 28-41 = Autumn, 42-55 = Winter
        const seasonCycleDay = this.currentDay % (SEASON_LENGTH * 4);
        this.currentSeason = Math.floor(seasonCycleDay / SEASON_LENGTH);
    }

    setSeason(seasonId) {
        if (seasonId >= 0 && seasonId <= 3) {
            this.currentSeason = seasonId;
            // Hack absolute time to align with start of that season
            const targetDay = seasonId * SEASON_LENGTH;
            // Note: Script API doesn't allow setting absolute time directly easily without commands
            world.getDimension("overworld").runCommandAsync(`time set ${targetDay * 24000}`);
            this.currentDay = targetDay;
            this.saveState();
            this.announceSeasonChange();
            this.applySeasonalWorldChanges();
        }
    }

    announceSeasonChange() {
        const seasonName = SEASON_NAMES[this.currentSeason];
        let color = "§a";
        let message = "";
        
        switch(this.currentSeason) {
            case SEASO.SPRING: color = "§a"; message = "The snow melts and flora blooms."; break;
            case SEASO.SUMMER: color = "§e"; message = "The sun beats down harshly."; break;
            case SEASO.AUTUMN: color = "§6"; message = "The leaves wither and a chill sets in."; break;
            case SEASO.WINTER: color = "§b"; message = "Frost covers the land. Prepare for the cold."; break;
        }

        for (const player of world.getAllPlayers()) {
            player.onScreenDisplay.setTitle(`${color}${seasonName} Has Arrived`, {
                subtitle: message,
                fadeInDuration: 20,
                stayDuration: 100,
                fadeOutDuration: 20
            });
        }
    }

    applySeasonalWorldChanges() {
        // In a full implementation, this is where we would:
        // 1. Swap texture packs (requires add-on restart, tricky on Bedrock dynamically)
        // OR 2. Replace blocks programmatically in loaded chunks (e.g. grass -> snow)
        // OR 3. Change weather patterns heavily
        
        // For our API level, we rely on the TemperatureSystem fetching the current season
        // and Weather manipulation
    }

    getSeasonModifier() {
        // Returns temperature modifier for the TemperatureSystem
        switch(this.currentSeason) {
            case SEASO.SPRING: return 0.0;
            case SEASO.SUMMER: return 10.0; // Hotter
            case SEASO.AUTUMN: return -5.0; // Cooler
            case SEASO.WINTER: return -20.0; // Freezing
            default: return 0.0;
        }
    }
    
    getSeason() {
        return this.currentSeason;
    }

    displaySeasonInfo(player) {
        const daysIn = (this.currentDay % SEASON_LENGTH) + 1;
        player.sendMessage(`§eCurrent Season: §f${SEASON_NAMES[this.currentSeason]} (Day ${daysIn}/${SEASON_LENGTH})`);
        
        // Forecast
        const mods = this.getSeasonModifier();
        const isExtreme = mods > 5 || mods < -5;
        const extremeDiurnal = this.currentSeason === SEASO.SUMMER;
        
        player.sendMessage("§eForecast:");
        player.sendMessage([
            mods > 0 ? "§c- Warmer than usual" : mods < 0 ? "§b- Colder than usual" : "§a- Mild temperatures",
            extremeDiurnal ? "§c- Extreme day/night variation" : ""
        ].filter(Boolean).join("\n"));
    }
}