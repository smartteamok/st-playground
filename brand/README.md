# Brand assets for ST-Playground

Source of truth for logos, icons and the default sprite. Copy into
`packages/scratch-gui` using the same filenames as upstream so merges do
not conflict.

| File | Used as |
|---|---|
| `st-playground-logo.svg` | Menu bar wordmark (`scratch-logo.svg` and the four time-travel variants). Official Smart TEAM mark. |
| `st-playground-logo-compact.svg` | Compact / Android wordmark: the violet **S** block (`scratch-logo-android.svg`) |
| `st-playground-icon.svg` | Isotype (same S block) |
| `st-playground-icon-512.png` | Installer icon and source for the `.ico` |
| `favicon/` | Smart TEAM tab icons (violet, cyan, amber, green, coral) plus the cycle script |
| `favicon.ico` | Playground shortcut icon (violet S) |
| `sprite-default-a.svg` / `sprite-default-b.svg` | Default project costumes (copied under their MD5 names) |
| `sprite-blip.wav` | Default sprite sound (copied under its MD5 name) |
| `cat-ears-replacement.svg` | Avatar badge frame (`cat-ears.svg`) |

To replace the logo later: overwrite the SVG here, copy it onto the
`scratch-logo*.svg` files in `packages/scratch-gui/src/components/menu-bar/`,
and restart the dev server. No code change.

Costume files in `packages/scratch-gui/src/lib/default-project/` are named
by the MD5 of their contents. After changing a costume, recompute:

```bash
md5sum brand/sprite-default-a.svg
```

Then rename the copy in `default-project/` and update `index.ts` plus
`project-data.ts`.
