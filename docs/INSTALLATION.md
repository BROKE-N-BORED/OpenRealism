# Installation Guide

## Android (Pocket Edition)

### Method 1: Direct Download

1. Download `OpenRealism.mcpack` from GitHub Releases
2. Tap the file - Minecraft PE will auto-import
3. Create new world or edit existing
4. Settings → Behavior Packs → My Packs → OpenRealism → Activate
5. **CRITICAL**: Enable these experiments:
   - Holiday Creator Features: ON
   - Beta APIs: ON
   - Upcoming Creator Features: ON

### Method 2: Manual Import

1. Download and extract `.zip` version
2. Move `behavior_packs/openrealism` to:
   `Android/data/com.mojang.minecraftpe/files/games/com.mojang/behavior_packs/`
3. Move `resource_packs/openrealism` to:
   `Android/data/com.mojang.minecraftpe/files/games/com.mojang/resource_packs/`

### Troubleshooting Android

- **"Failed to import"**: Check file permissions, ensure experiments enabled
- **Scripts not working**: Verify Beta APIs enabled
- **Pink/black textures**: Resource pack not applied, check installation path

## iOS

1. Download `.mcpack` on iOS device
2. Open in Minecraft
3. Follow Android activation steps above

## Windows 10/11

1. Double-click `.mcpack` file
2. Minecraft auto-imports
3. World settings → Behavior Packs → Activate

## Console (Xbox/PlayStation/Switch)

**Note**: Console support limited due to platform restrictions

- Must use Realms or LAN host from Windows/Android device
- Cannot directly install on console

## Verification

Type in chat:

- `!thirst` - Should show thirst level
- `!season` - Should show current season
- `!climate` - Should show biome data

If commands work, installation successful.