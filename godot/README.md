# Faithbound (Godot 4)

Phase 1 of the native version: a living landscape with realistic lighting, rivers, forests, a grass
carpet that sways in the wind, villages that grow along their own lanes with cottages, fenced plots and
gardens, roads between towns, borders, townsfolk walking about, and the core simulation (tribes, nations,
ages, towns, wars).

## Run it
1. Download **Godot 4** (version 4.4 or newer, the standard build, not .NET) from godotengine.org. It is a
   single program; no installation needed.
2. Unzip this folder somewhere, start Godot, choose **Import**, and select `project.godot` in this folder.
3. The first time, Godot imports the textures, which takes a minute. Then press **F5** (or the play button
   at the top right).

Building the world takes a few seconds when the game starts.

## Controls
- **WASD** or arrow keys: move (hold Shift to move faster)
- **Mouse wheel**: zoom
- **Right-drag**, or **Q / E**: turn
- **Middle-drag**: pan
- **Click** a piece of land to see the nation that owns it.
- **Space** pauses. **1 / 2 / 3** set the speed.
- **Skip 100 years** fast-forwards the world.
- **F12** saves a screenshot. The chronicle tells you where it went.
- **Graphics**: Low, Medium, High or Ultra. Medium suits a GTX 1060 class card at 1080p.

## Better textures (optional)
`tools/fetch_textures.ps1` downloads free CC0 photo-scanned textures from Poly Haven (grass, forest floor,
rock, sand, snow, roads, thatch, planks, plaster, bark) into `assets/scanned`. The game prefers those over
its built-in generated textures. Run it from this folder in PowerShell:

    powershell -ExecutionPolicy Bypass -File tools\fetch_textures.ps1

There is also `tools/fetch_textures.py` if you prefer Python. After downloading, open the project in
Godot again so it imports the new files.

## Preview renders from the command line
    godot --path . -- --seed=31337 --years=1400 --dist=230 --quality=2 --shot=preview.png

This simulates 1400 years, renders one frame, saves it as `preview.png` and quits.

## Making a Windows build
In the Godot editor: **Project → Export → Add… → Windows Desktop**. Download the export templates when
asked, then **Export Project**.

## Files
- `scripts/world.gd`: landscape generation, rivers, biomes and the tile grid
- `scripts/terrain_builder.gd`: terrain meshes, sea and rivers
- `scripts/sim.gd`: the simulation (nations, spread, towns, ages, war)
- `scripts/town_builder.gd`: town plans, cottages, plots, churches, streets and roads
- `scripts/mesh_kit.gd`: the small modelling kit used for buildings
- `scripts/foliage.gd`: trees and the grass carpet
- `scripts/villagers.gd`: people walking in town
- `scripts/borders.gd`: realm borders
- `scripts/camera_rig.gd`: the strategy camera
- `scripts/hud.gd`: the interface
- `shaders/`: terrain, water, grass, leaves, villagers, borders
- `tools/gen_textures.py`: regenerates the built-in textures
