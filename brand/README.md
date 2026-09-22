# /brand — drop client assets here

The `/brand-extract` workflow pulls the brand from https://cafe.tazagreens.org automatically.
If the site can't be read (blocked, changed, or heavy JavaScript), put these files here and tell the agent:

| File | What | Notes |
|------|------|-------|
| `logo.svg` (or `logo.png`) | Main logo | Vector preferred. Transparent background. |
| `logo-mark.svg` | Icon / symbol only | Used for the bot picture and app icon |
| `screenshot-mobile-home.png` | Phone screenshot of the client site | 390px wide is ideal |
| `screenshot-desktop-home.png` | Desktop screenshot | Full page if possible |
| `menu.pdf` / `menu-photos/` | Current menu | For seeding categories, items, prices |
| `fonts/` | Brand font files, if the client owns licenses | Otherwise the agent picks the closest open font |

Agent output lives in `public/brand/` (optimized copies) and `docs/DESIGN.md` (the tokens).
