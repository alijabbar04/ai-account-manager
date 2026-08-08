import { build } from "esbuild";
import { copyFile } from "node:fs/promises";

const common = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
  sourcemap: false,
  minify: false
};

await build({
  ...common,
  entryPoints: ["electron/main.ts"],
  outfile: "dist-electron/main.cjs"
});

await build({
  ...common,
  entryPoints: ["electron/preload.ts"],
  outfile: "dist-electron/preload.cjs"
});

// static page for the in-app PDF guide viewer window
await copyFile("electron/guide-viewer.html", "dist-electron/guide-viewer.html");

console.log("main + preload bundled");
