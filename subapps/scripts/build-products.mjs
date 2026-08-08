import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "vite";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputRoot = path.join(projectRoot, "dist-products");
// Each artifact is independently deployable and indexable only at its standalone
// canonical domain; Fixars connector hosts and paths are configured as edge redirects.
const products = [
  {
    key: "skillscanvas",
    name: "SkillsCanvas",
    canonical: "https://skillscanvas.co/",
    connector: "https://skills.fixars.ai/",
    path: "https://fixars.ai/skills",
  },
  {
    key: "conceptnexus",
    name: "ConceptsNexus",
    canonical: "https://conceptsnexus.co/",
    connector: "https://concepts.fixars.ai/",
    path: "https://fixars.ai/concepts",
  },
  {
    key: "collaboard",
    name: "CollaBoard",
    canonical: "https://collaboard.co/",
    connector: "https://collab.fixars.ai/",
    path: "https://fixars.ai/collab",
  },
  {
    key: "vestden",
    name: "VestDen",
    canonical: "https://vestden.co/",
    connector: "https://vest.fixars.ai/",
    path: "https://fixars.ai/vest",
  },
];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const product of products) {
  const outputDir = path.join(outputRoot, product.key);
  await build({
    root: projectRoot,
    configFile: path.join(projectRoot, "vite.config.mjs"),
    define: {
      "import.meta.env.VITE_DEFAULT_PRODUCT": JSON.stringify(product.key),
    },
    build: {
      outDir: outputDir,
      emptyOutDir: true,
    },
  });

  const indexPath = path.join(outputDir, "index.html");
  const indexHtml = await readFile(indexPath, "utf8");
  const productHtml = indexHtml
    .replace(
      "<title>Fixars product previews</title>",
      `<title>${product.name} — Fixars</title>\n    <link rel="canonical" href="${product.canonical}" />`,
    )
    .replace(
      'content="Fixars connected product previews"',
      `content="${product.name}, part of the connected Fixars ecosystem"`,
    );
  await writeFile(indexPath, productHtml, "utf8");
  await writeFile(
    path.join(outputDir, "deployment.json"),
    `${JSON.stringify(product, null, 2)}\n`,
    "utf8",
  );
}

console.log(
  `Built ${products.length} isolated product artifacts in ${outputRoot}.`,
);
