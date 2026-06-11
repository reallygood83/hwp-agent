# Vendored rhwp-studio

This directory contains the production build of `rhwp-studio` from `edwardkim/rhwp` version `0.7.13`.

Source: https://github.com/edwardkim/rhwp

The Obsidian plugin loads this local `index.html` through `@rhwp/editor`'s `studioUrl` option so edit mode does not depend on the default hosted `https://edwardkim.github.io/rhwp/` editor.

Build notes:

1. Download `edwardkim/rhwp` tag `v0.7.13`.
2. Copy `@rhwp/core@0.7.13`'s `rhwp.js`, `rhwp.d.ts`, `rhwp_bg.wasm`, and `rhwp_bg.wasm.d.ts` into the upstream source `pkg/` directory.
3. Run `npm install` and `npm run build` inside `rhwp-studio/`.
4. Copy the production `dist/` files needed by the plugin.
5. Remove sample documents and PWA service worker files.
6. Rewrite root-relative asset paths to relative paths for Obsidian plugin resource loading.
7. Replace upstream CDN font fallbacks with bundled local Korean font fallbacks.

The upstream rhwp license is included as `LICENSE.rhwp`.
