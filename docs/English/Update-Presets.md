# Update Preset List

```mermaid
flowchart TD
    Start["Run ./scripts/welcome-updater"] --> Scan["Scan presets/ for .json files"]
    
    Scan --> Generate["Generate presets/manifest.json"]
    
    Generate --> Update["Update welcome.html<br/>(between marker comments)"]
    
    Update --> Sort["Sort presets:<br/>1. Init files first<br/>2. Then alphabetically"]
    
    Sort --> Links["Generate Editor + Player links<br/>for each preset"]
    
    Links --> Done["✅ Done!<br/>Click 'Refresh' on welcome page"]
    
    style Start fill:#2d3748,stroke:#4299e1,color:#fff
    style Generate fill:#2c5282,stroke:#90cdf4,color:#fff
    style Done fill:#22543d,stroke:#68d391,color:#fff
```

## Usage

Run the script to automatically update the welcome page with all presets found in `presets/`:

```bash
./scripts/welcome-updater
```

## Function

The script:
- Scans `presets/` directory for `.json` files
- Generates `presets/manifest.json` with preset metadata
- Updates `welcome.html` between marker comments
- Sorts presets with init files first, then alphabetically
- Generates both Editor and Player links for each preset

## Adding New Presets

1. Save your preset file to `presets/filename.json`
2. Run `./scripts/welcome-updater`
3. Click "Refresh" button on welcome page (or reload page)

## Dynamic Loading

The welcome page includes a **Refresh** button that reloads the preset list from `manifest.json` without requiring a page reload.

**Workflow:**
1. Add preset file to `presets/`
2. Run `./scripts/welcome-updater` (generates manifest)
3. Click "Refresh" button on welcome page

## Markers

Do not remove these HTML comments from `welcome.html`:
```html
<!-- PRESETS_START -->
<!-- PRESETS_END -->
```

The script replaces all content between these markers.

---

See [scripts/README.md](scripts/README.md) for all available scripts.
