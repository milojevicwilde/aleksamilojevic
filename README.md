# Aleksa Milojević — personal site

Static one-page site: plain HTML/CSS/JS, no build step.

```
index.html          The page (text; only Milojević + Wilde and VOGELFREI are links)
css/style.css       Styling: off-white sky, pixel type, link blue, layout
js/city.js          The pixel ideal city along the bottom + the drifting clouds
fonts/              GNU Unifont, Latin subset (pixel font; licence in fonts/README.txt)
favicon.ico, images/favicon*, apple-touch-icon.png   Icons
images/share.png    Link preview image (1200×630)
```

## The city
Drawn by `js/city.js`, pixel by pixel, after the Renaissance "Ideal City" panels (Urbino, Baltimore,
Berlin): one-point perspective with the vanishing point exactly mid-screen, a round temple on the axis,
palazzi receding on both sides, a patterned piazza, a pair of columns with statues, a few figures.
It redraws to fit any screen: on wide screens the piazza widens and the palazzi gain storeys.
Things to tweak near the top of the file: the palette (`C`), the palazzi (`STYLES`, `BLOCKS`,
`HEIGHT`), the temple (`ZT`, `R`), the figures (`PEOPLE`).

Clouds: a few small white clouds that move one pixel at a time (about one step every 1–2 seconds).
Visitors who switch off animations in their system settings see them standing still.

## Deploy
Upload everything to the repository, replacing the old files, and delete files that are no longer
in this folder (`js/garden.js`, `js/sprites.js`). Cloudflare Pages / GitHub Pages: no build command,
output directory root.
