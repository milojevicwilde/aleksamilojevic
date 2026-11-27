# Aleksa Milojević — website

One-page static site: plain HTML/CSS with one tiny script. No build step, no fonts to load.
Open `index.html` in a browser to preview it.

```
index.html          The page: name, bio, two links, footer. All text is edited here.
css/style.css       All styling. Colours, grain and sizes are at the top (:root).
js/fit.js           Lowers the text size on small screens so the page never scrolls.
images/favicon.svg  Browser tab icon.
```

## Editing

- **Text and links:** `index.html`.
- **Background colours:** `--bg-top` (white), `--bg-mid`, `--bg-bottom` (cyan) in `css/style.css`.
- **Letter colours:** `--ink-1` (magenta) and `--ink-2` (purple).
- **Grain strength:** `--grain` (0 = off, ~.55 now).
- **Link pulse speed:** `animation: pulse 4.2s` under `.pulse`.
- **Header name in upper case:** remove `text-transform: uppercase;` under `.wordmark`
  to show it as "Aleksa Milojević" instead.

## Putting it online (GitHub + Cloudflare)

1. Create a new repository on GitHub and upload the *contents* of this folder
   (so `index.html` sits at the top level of the repo, not inside a subfolder).
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `/`
3. After the first deploy, open the project → **Custom domains → Set up a custom domain**
   and enter your domain. If the domain's DNS is already on Cloudflare, it connects automatically.

Every later change you push to GitHub goes live by itself within a minute.

*(Alternative: GitHub Pages — Settings → Pages → Deploy from branch → `main`, `/ (root)` —
with Cloudflare only handling the DNS.)*
