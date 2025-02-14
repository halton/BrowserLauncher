#!/bin/bash

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create icons directory if it doesn't exist
mkdir -p icon.iconset

# First convert SVG to high-res PNG
magick icon.svg -resize 1024x1024 icon_base.png

# For macOS (icns)
magick icon_base.png -resize 16x16 icon.iconset/icon_16x16.png
magick icon_base.png -resize 32x32 icon.iconset/icon_32x32.png
magick icon_base.png -resize 64x64 icon.iconset/icon_64x64.png
magick icon_base.png -resize 128x128 icon.iconset/icon_128x128.png
magick icon_base.png -resize 256x256 icon.iconset/icon_256x256.png
magick icon_base.png -resize 512x512 icon.iconset/icon_512x512.png
magick icon_base.png -resize 1024x1024 icon.iconset/icon_1024x1024.png

# Create icns file
iconutil -c icns icon.iconset -o icon.icns

# For Linux (png)
cp icon_base.png icon.png

# For Windows (ico)
magick icon_base.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Clean up
rm -rf icon.iconset icon_base.png