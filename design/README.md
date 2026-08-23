# Fixars Design Assets

This folder holds all design-related files used to shape the Fixars Superapp UI.

## Folder Structure

```
design/
├── brand/          # Logos, wordmarks, brand guidelines (PNG, SVG, PDF)
├── typography/     # Font files, type specimens (TTF, OTF, WOFF, WOFF2)
├── colors/         # Color palette exports, tokens (JSON, CSS, PNG swatches)
├── components/     # Component designs & specs (Figma exports, annotated PNGs)
├── mockups/        # Full-page mockups & wireframes (PNG, PDF, Figma links)
├── icons/          # Icon sets & custom icons (SVG, PNG)
└── exports/        # Raw Figma / Sketch / XD exports or ZIP archives
```

## How to Add Files

Simply copy your design files into the appropriate subfolder above.

**Quick copy from Desktop (PowerShell):**
```powershell
# Copy a specific file
Copy-Item "$env:USERPROFILE\Desktop\your-file.png" -Destination ".\design\mockups\"

# Copy ALL files from Desktop into exports (bulk)
Copy-Item "$env:USERPROFILE\Desktop\*" -Destination ".\design\exports\" -Recurse
```

**Or just drag & drop** files into the relevant folder using File Explorer.

## File Naming Convention

Use kebab-case with descriptive names:

| Example | Category |
|---------|----------|
| `fixars-logo-primary.svg` | brand/ |
| `fixars-color-tokens.json` | colors/ |
| `dashboard-mockup-v2.png` | mockups/ |
| `header-component-spec.png` | components/ |
| `icon-set-outlined.svg` | icons/ |

## Integration Workflow

Once files are placed here, they will be:
1. Reviewed and analysed
2. Translated into CSS variables / tokens in `src/index.css`
3. Reflected in components under `src/components/`
4. Applied across all four sub-apps
