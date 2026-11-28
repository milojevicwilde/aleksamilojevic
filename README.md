# Aleksa Milojević — personal site

Static one-page site: plain HTML/CSS/JS, no build step.

```
index.html          The page (text + links)
css/style.css       Styling: off-white, pixel type, link blue
js/sprites.js       Pixel art: flowers, bee, dalmatian (one character = one pixel)
js/garden.js        Draws and animates the garden
fonts/              GNU Unifont, Latin subset (pixel font; licence in fonts/README.txt)
favicon.ico, images/favicon*, apple-touch-icon.png   Pixel daisy icon
images/share.png    Link preview image (1200×630)
```

Deploy: upload everything to the repository (replace the old files and delete old ones that
are not in this folder, e.g. an old favicon). Cloudflare Pages / GitHub Pages: no build command,
output directory root.
