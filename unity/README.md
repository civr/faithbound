# Faithbound for Unity: milestone 1

This is the first step of moving Faithbound to Unity. You get the world from a seed (terrain, sea, rivers, biomes and forests), sunlight with shadows, fog, and the god camera.

The world generation is a direct port of the browser code. With rivers off, the same seed gives the same heights and biomes as the browser version, checked tile by tile. Rivers come out different, because in the browser they use an unseeded random number.

## Open it

1. Install **Unity Hub** and **Unity 6** (any 6000.x version) from unity.com. The free Personal licence is fine.
2. In Unity Hub, choose **New project** and pick the **Universal 3D** template (URP). Give it a name and create it.
3. Copy the `Assets/Faithbound` folder from here into the new project's `Assets` folder. Dragging it into the Project panel also works.
4. Wait for Unity to finish compiling. The bar at the bottom right shows progress.
5. Open `Assets/Scenes/SampleScene` and press **Play**.

There's no setup step. The game adds itself to whatever scene is open.

## Controls

| Input | Action |
|---|---|
| Left drag | Move over the map |
| Right drag, or Q / E | Turn |
| Scroll | Zoom |
| WASD or arrow keys | Move |

The panel at the top left sets the seed, map size and the land, mountains, rain, warmth and rivers sliders. Press **Build world** to generate. It also shows fps and the tree count.

## If something goes wrong

- **Red errors in the Console window:** copy the first one and send it to me.
- **Everything is pink:** the project isn't using URP. Make a new project with the Universal 3D template.
- **Input errors** ("You are trying to read Input using the UnityEngine.Input class…"): go to Edit → Project Settings → Player → Active Input Handling and set it to **Both**.

## Files

| File | Purpose |
|---|---|
| `FBMath.cs` | mulberry32, value noise and hash, bit for bit as in core.js |
| `FBWorld.cs` | genWorld, genRivers and computeTerrain: heights, moisture, rivers and biomes |
| `FBTerrain.cs` | Ground mesh in chunks, ground and water colours, sea, ocean and river ribbons |
| `FBForest.cs` | Trees by biome, drawn with GPU instancing in batches per patch of land |
| `FBCamera.cs` | God camera |
| `FBGame.cs` | Starts the game, sets up light and fog, draws the panel |

## Next milestones

1. ~~World, light, camera~~
2. Simulation: nations, faiths, wars, eras, saving
3. Towns and buildings using the same models as the browser
4. Moving things: people, animals, ships, trains, caravans
5. Powers and the full interface
6. Co-op
