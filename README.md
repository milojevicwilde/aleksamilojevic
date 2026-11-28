# Aleksa Milojević — personal site

One static page in the manner of sanaa.co.jp: white, Helvetica, the name centred in the upper part of
the screen, a small centred text below. No scripts, no web fonts.

```
index.html          The page (only Milojević + Wilde and VOGELFREI are links)
css/style.css       Styling
favicon.ico, images/favicon.svg, favicon-48/96/192/512.png, apple-touch-icon.png
                    "AM" monogram (Helvetica-style letters) for the browser tab, Google, home screens
images/share.png    Link preview image (1200×630)
```

## Deploy
Replace everything in the repository with this folder's contents and **delete what is no longer here**:
`js/` (city.js, garden.js, sprites.js) and `fonts/`. Cloudflare Pages / GitHub Pages: no build command,
output directory root.

## The old icon in Google and browser tabs
- Browsers cache icons. After deploying, reload the page with Cmd+Shift+R (Ctrl+Shift+R on Windows);
  if the old icon sticks, clear the browser cache or open the site in a private window.
- Google shows the new icon after it next crawls the site. To speed this up: Google Search Console →
  URL Inspection → enter the homepage → Request indexing. It can still take a few days.
