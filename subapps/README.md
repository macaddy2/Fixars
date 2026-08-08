# Fixars independent product sites

This package produces four independently deployable static artifacts for
SkillsCanvas, ConceptsNexus, CollaBoard, and VestDen.

```bash
npm install
npm run architecture:validate
npm run build:products
```

`dist-products/` contains the exact canonical-domain artifacts. The standalone
`.co` domains are the only indexable product origins. The `*.fixars.ai`
connectors are permanent redirects and must not be configured as duplicate app
origins.

The repository-root `.cpanel.yml` copies only these validated artifacts into
their isolated document roots. It does not alter Fixars.ai, its waitlist, or
FixarsGroup.com.
