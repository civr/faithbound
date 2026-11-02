# Downloads free CC0 scanned textures from Poly Haven (polyhaven.com) into assets/scanned.
# Faithbound uses them automatically instead of the built-in generated textures.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File tools\fetch_textures.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "assets\scanned"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$headers = @{ "User-Agent" = "Faithbound-texture-fetch/1.0" }
$res = "2k"
# each layer: the first Poly Haven texture whose id contains one of these words
$want = [ordered]@{
  grass   = @("aerial_grass", "grass_path", "forest_grass", "grass")
  forest  = @("forest_leaves", "forrest_ground", "forest_ground", "leaves")
  sand    = @("coast_sand", "sand")
  dirt    = @("brown_mud", "dirt", "mud")
  path    = @("gravel_road", "dirt_road", "gravel", "rocky_trail")
  rock    = @("rock_face", "cliff", "rocky_terrain", "rock")
  snow    = @("snow")
  thatch  = @("thatch", "straw", "hay")
  timber  = @("weathered_planks", "wood_planks", "planks")
  plaster = @("plastered", "plaster", "white_wall")
  bark    = @("bark")
}
Write-Host "Reading the Poly Haven texture list..."
$assets = Invoke-RestMethod -Uri "https://api.polyhaven.com/assets?t=textures" -Headers $headers
$ids = $assets.PSObject.Properties.Name
foreach ($layer in $want.Keys) {
  $pick = $null
  foreach ($word in $want[$layer]) { $pick = $ids | Where-Object { $_ -like "*$word*" } | Select-Object -First 1; if ($pick) { break } }
  if (-not $pick) { Write-Host "  $layer : nothing found, keeping the built-in texture"; continue }
  $files = Invoke-RestMethod -Uri "https://api.polyhaven.com/files/$pick" -Headers $headers
  $diff = $files.Diffuse.$res.jpg.url
  $nor = $files.nor_gl.$res.jpg.url
  if (-not $diff) { Write-Host "  $layer : $pick has no diffuse map, skipped"; continue }
  Invoke-WebRequest -Uri $diff -OutFile (Join-Path $out "${layer}_albedo.jpg") -Headers $headers
  if ($nor) { Invoke-WebRequest -Uri $nor -OutFile (Join-Path $out "${layer}_normal.jpg") -Headers $headers }
  Write-Host "  $layer : $pick"
}
Write-Host "Done. Open the project in Godot; it imports the new textures and uses them."
