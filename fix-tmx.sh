#!/bin/bash
# Run this after every Tiled save to restore CC2.4.8-compatible TMX header
sed -i '' 's/version="1\.10" tiledversion="1\.12\.1"/version="1.2"/g' \
  MarioGame/assets/resources/tilemaps/level1.tmx \
  tilemaps/level1.tmx 2>/dev/null
echo "TMX version fixed ✓"
