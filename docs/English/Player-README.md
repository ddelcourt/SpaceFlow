# SpaceFlow Player Mode

## Overview

The **Player Mode** is a minimal, distribution-friendly version of ZigMap26 designed for audiences to enjoy your creations without the complexity of the editor interface.

## Features

✨ **Drag & Drop Loading** — Simply drag a `.json` preset file onto the player  
🎬 **Auto-Play** — Automatically starts playback if auto-trigger is enabled  
⌨️ **Keyboard Controls** — Use spacebar, arrow keys to control playback  
📱 **Fullscreen Canvas** — Immersive, distraction-free viewing experience  
🚫 **No Editing** — Clean interface with no editor controls visible  

---

## How to Use

### Option 1: Drag & Drop
1. Open `player.html` in your web browser
2. Drag a `.json` preset file (created with SpaceFlow Editor) onto the page
3. The visualization will automatically load and start playing

### Option 2: File Selector
1. Open `player.html` in your web browser
2. Click the "Select File" button
3. Choose a `.json` preset file from your computer
4. The visualization will automatically load and start playing

---

## Creating Presets for Player Mode

1. Open `index.html` (the main SpaceFlow Editor)
2. Create your visualization with states, colors, and transitions
3. Enable **Auto-Trigger States** if you want automatic playback
4. Click **Save** in the Project section to export a `.json` file
5. Share this `.json` file with your audience along with `player.html`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Spacebar** | Play / Pause auto-trigger |
| **Left Arrow** | Previous state in history |
| **Right Arrow** | Skip to next state |
| **ESC** | Exit fullscreen (browser default) |

---

## Distribution

To share your work with others:

1. **Include these files:**
   - `player.html`
   - `css/player.css`
   - `js/` folder (all .js files and subfolders)
   - `config/` folder (configuration files)
   - Your `.json` preset file

2. **Host online** or share as a folder

3. **Instructions for viewers:**
   - Open `player.html` in a modern web browser
   - Drag the provided `.json` file onto the page
   - Enjoy!

---

## Technical Details

- **No localStorage** — Player mode doesn't save settings
- **No export functions** — Viewers cannot export SVG/PNG/video
- **Auto-trigger only** — Manual state editing is disabled
- **Minimal dependencies** — Only requires p5.js (loaded from CDN)

---

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari

Requires a modern browser with WebGL support.

---

## Troubleshooting

**"Invalid file type" error**
- Make sure you're dropping a `.json` file created with SpaceFlow Editor
- File must have `.json` extension

**Visualization doesn't load**
- Check browser console for errors (F12)
- Ensure all files are in the correct folder structure
- Try a different preset file

**Auto-trigger doesn't start**
- The preset may not have auto-trigger enabled
- Try using spacebar to manually start playback
- Check that the preset has multiple states

---

## Performance Tips

For best performance on lower-end devices:
- Reduce the number of lines in your presets
- Use shorter transition durations
- Disable depth invert if not needed
- Limit the number of states

---

Created with SpaceFlow v26 🎨
