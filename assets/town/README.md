# Town art working area

This directory is the editable Town-side art workspace.

## Source separation rule

- Pristine third-party source: `assets/third-party/puny-world/`
- Editable Town work: `assets/town/`

Never modify the files in `assets/third-party/puny-world/`.
When Town needs recolors, crops, rearranged sheets, derived buildings, coast variants, or other adaptations, create or modify them here.

## Current base copy

`base/punyworld-overworld-tileset.png` is initially byte-identical to the pristine Puny World sheet.

`base/punyworld-overworld-tiles.tsx` is the matching Tiled metadata reference.

These are working copies. Future Town art passes may change files in this directory while the pristine third-party copy stays untouched.

## Planned Town-owned organization

- `terrain/` - grass, dirt, stone, elevation
- `coast/` - sand, seawater, shore transitions, docks
- `buildings/` - Town-specific houses, shops, station, lighthouse
- `decor/` - trees, bushes, flowers, props

The current Pixel Town v0.2 runtime has not been switched to these assets yet.
