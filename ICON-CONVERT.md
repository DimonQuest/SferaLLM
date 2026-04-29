# Конвертация иконки

Используйте icon.svg для создания иконок:

## Онлайн инструменты:
1. **icon.ico** (Windows): https://convertio.co/svg-ico/ (размер 256x256)
2. **icon.icns** (macOS): https://cloudconvert.com/svg-to-icns
3. **icon.png** (Linux): https://convertio.co/svg-png/ (размер 512x512)

## Или используйте ImageMagick:
```bash
# Windows .ico
magick convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# macOS .icns
png2icns icon.icns icon.svg

# Linux .png
magick convert icon.svg -resize 512x512 icon.png
```

Поместите готовые иконки в папку `public/`
