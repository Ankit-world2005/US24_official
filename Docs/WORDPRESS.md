# US24 Solutions on WordPress

The design of `US24 3D Hero.html` (the interactive revenue-cycle city), in the US24 brand colours: deep navy and blue with the logo orange as the accent,
applied to every page of the live site, as two WordPress packages:

| Package | What it is | Upload at |
|---|---|---|
| `dist/us24-theme.zip` (`us24/`) | Block theme: design system, header with mega-menu, footer, templates, and the **US24 3D Hero** block (three.js r128 and fonts self-hosted) | Appearance → Themes → Add New → Upload |
| `dist/us24-site.zip` (`us24-site/`) | Site plugin: imports all 67 pages + 1 post as editable blocks, contact & career forms, office details in one place, SEO descriptions | Plugins → Add New → Upload |

Content source: a crawl of https://us24solutions.com on 2026-10-15 (`tools/data/content.json`).
[`SITE-AUDIT.md`](SITE-AUDIT.md) lists what was found on the live site and what changed on the way over.

## Install

Requires WordPress 6.6+ (tested on 7.1) and PHP 8.0+ (Hostinger runs 8.1).

1. **Try it on a staging copy first.** Hostinger: hPanel → Websites → your site → Staging.
2. Upload and activate the **US24** theme.
3. Upload and activate the **US24 Site** plugin.
4. Go to **Tools → US24 Import**.
   - On a fresh WordPress: click **Import pages**.
   - On the existing us24solutions.com (all 67 URLs already exist as Elementor pages): tick
     **Replace existing pages that have the same URL**, then **Import pages**. Every original page
     (content, template, Elementor setting) is backed up first. **Undo import** restores all of it.
5. Check **Settings → US24 Site** (form inboxes, office addresses, phones, social links).
6. Open the Pages list. The **Review** column flags pages whose live copy needs an editor (copied text, thin pages…).

Same thing from the command line: `wp us24 import [--replace]`, `wp us24 status`, `wp us24 undo`.

URLs stay exactly as they are on the live site (`/medical-coding-services/` etc.), so search rankings and
links carry over. The importer switches permalinks to "Post name" when needed.

### After switching the live site

- Elementor, ElementsKit, Essential Addons and Sina Extension are no longer used by these pages. Deactivate them
  only after checking nothing else (popups, templates) depends on them.
- Rank Math can stay: the importer only fills empty Rank Math descriptions and leaves tuned ones alone.
- Contact Form 7 is no longer needed for these pages; the forms are built into the plugin and mail
  through `wp_mail()`. Hostinger's default mail works; an SMTP plugin improves deliverability.
- Purge LiteSpeed Cache after the import.

## Editing

Everything is core blocks plus a few styles (Card, Panel, Eyebrow, Lead, Checklist, Pills, Framed, Avatar, Glass
quote), so pages are edited in the normal block editor. Three custom blocks:

- **US24 3D Hero**: headline, text, buttons and tour are in the block sidebar. The 3D city runs on the published page only.
- **US24 Contact form**: "Enquiry" or "Job application (with CV upload)". Mail goes to the inboxes in Settings → US24 Site.
- **US24 Offices**: the three offices from Settings → US24 Site.

"US24 – Free quote form & offices" and "US24 – Risk-free trial" are synced patterns: edit once under
Appearance → Editor → Patterns and every page that uses them updates.

## Rebuilding the content package

```sh
cd wordpress/tools
npm install
node crawl.mjs <work dir>                         # fetch every page (REST + HTML) from us24solutions.com
node extract.mjs <work dir>                       # → <work dir>/content.json
cp <work dir>/content.json data/content.json
node build-content.mjs data/content.json ../us24-site/content
node port-hero.cjs "../../US24 3D Hero.html" ../us24/blocks/hero-3d/view.js   # after editing the standalone hero
node package.mjs                                  # → ../dist/*.zip
```

## Local preview

```sh
cd wordpress/tools && npm install
npx wp-playground-cli server --php 8.1 --login \
  --mount-dir ../us24 /wordpress/wp-content/themes/us24 \
  --mount-dir ../us24-site /wordpress/wp-content/plugins/us24-site \
  --blueprint ../dev/blueprint.json
# then, in another terminal:
node verify.mjs http://127.0.0.1:9400 ../us24-site/content/pages.json ../dev/shots
```

`verify.mjs` loads every page and fails on PHP/JS errors, missing or extra H1s, broken images, internal 404
links, and any block the editor reports as invalid.
