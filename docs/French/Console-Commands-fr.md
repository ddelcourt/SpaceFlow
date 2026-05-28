# SpaceFlow — Référence des Commandes Console

**Commandes Console du Navigateur et API Globale**

Ce document liste toutes les commandes console et fonctions globales disponibles pour le débogage, l'automatisation et le contrôle avancé de SpaceFlow.

---

## Table des Matières

0. [Comprendre SpaceFlow : Framework vs Patch](#comprendre-spaceflow--framework-vs-patch)
1. [Surveillance de Performance](#surveillance-de-performance)
2. [Espace de Noms Global](#espace-de-noms-global)
3. [Fonctions d'Export](#fonctions-dexport)
4. [Gestion des États](#gestion-des-états)
5. [Fonctions de Stockage](#fonctions-de-stockage)
6. [Contrôle Caméra](#contrôle-caméra)
7. [Système de Couleurs](#système-de-couleurs)
8. [Accès aux Paramètres](#accès-aux-paramètres)
9. [Opérations Avancées](#opérations-avancées)

---

## Comprendre SpaceFlow : Framework vs Patch

**SpaceFlow est un framework**, pas seulement une application. Il fournit des systèmes universels qui fonctionnent avec n'importe quel algorithme visuel (patch).

### Framework (Universel)

Ces systèmes sont **toujours disponibles** quel que soit le patch chargé :

- 🎥 **Système Caméra** — Navigation 3D, contrôles orbitaux, projection
- 🎨 **Système Couleur** — 4 palettes avec 4 couleurs chacune, transitions fluides
- 💾 **Système Stockage** — localStorage, import/export JSON
- 📊 **Gestion États** — Sauvegarder/charger snapshots complets, navigation historique
- 📤 **Système Export** — SVG, PNG, cartes de profondeur, enregistrement vidéo
- 🔗 **Sync Fenêtres** — Coordination multi-fenêtres
- 🖼️ **Système Overlay** — Positionnement logo/branding
- 🏛️ **Shell UI** — Génération panneau de contrôle et mise en page

### Patch (Actuel : Émetteur Zigzag)

L'**algorithme visuel** qui génère les graphiques. Patch actuellement chargé :

- **Nom :** Émetteur Zigzag
- **Objectif :** Motifs de rubans animés 3D
- **Paramètres spécifiques au patch :** `segmentLength`, `lineThickness`, `emitRate`, `speed`, paramètres de modulation
- **Objets spécifiques au patch :** `window.SpaceFlow.emitterInstance`, tableau `lines`

### Concept Clé

💡 **Les commandes framework** (caméra, couleurs, export, états) fonctionneront avec N'IMPORTE QUEL patch futur.  
💡 **Les commandes patch** (emitterInstance, lines) sont spécifiques au patch Zigzag.

En lisant cette documentation :
- ✅ **Opérations framework** sont pérennes
- ⚠️ **Opérations patch** peuvent ne pas exister dans d'autres patches

---

## Surveillance de Performance

### `showPerformanceStats()`

Affiche des métriques de performance détaillées dans la console.

**Utilisation :**
```javascript
showPerformanceStats()
```

**Sortie :**
```
═════════════════════════════════════════
PERFORMANCE STATS (last 60 frames)
═════════════════════════════════════════
FPS:
  Current: 60.0
  Average: 59.8
  Min: 58.2
  Max: 60.0

Frame Time:
  Average: 16.72ms
  Max: 17.21ms
  Target: 16.67ms (60fps)

Rendering:
  Active Lines: 87
  Draw Calls/Frame: 87
  Update Calls/Frame: 0
═════════════════════════════════════════
```

**Quand l'utiliser :**
- Diagnostic de problèmes de performance
- Identification de chutes de fréquence d'images
- Surveillance de la charge de rendu
- Vérification des résultats d'optimisation

---

## Espace de Noms Global

Toutes les fonctionnalités sont accessibles via l'objet global `window.SpaceFlow` (alias : `ZM`).

```javascript
const ZM = window.SpaceFlow;
```

### Propriétés Framework (Universelles)

Ces propriétés sont **toujours disponibles** quel que soit le patch chargé :

```javascript
// Voir les paramètres actuels (framework + patch)
console.log(window.SpaceFlow.params);

// Vérifier l'état de la caméra (framework)
console.log(window.SpaceFlow.camera);

// Vérifier les dimensions du canvas (framework)
console.log(window.SpaceFlow.W, window.SpaceFlow.H);

// Gestionnaire d'états (framework)
console.log(window.SpaceFlow.stateManager);

// Instance p5.js (framework)
console.log(window.SpaceFlow.p5Instance);
```

### Propriétés Spécifiques au Patch (Zigzag)

Ces propriétés sont **spécifiques au patch Émetteur Zigzag** :

```javascript
// Instance émetteur zigzag (spécifique au patch)
console.log(window.SpaceFlow.emitterInstance);

// Compter les lignes actives (spécifique au patch)
console.log(window.SpaceFlow.emitterInstance.lines.length);

// Décalage de bruit pour l'animation (spécifique au patch)
console.log(window.SpaceFlow.noiseOffset);
```

⚠️ **Note :** Les propriétés spécifiques au patch peuvent ne pas exister si un autre patch est chargé à l'avenir.

---

## Fonctions d'Export

### `window.SpaceFlow.exportSVG()`

Exporte l'image actuelle en graphique vectoriel SVG.

**Utilisation :**
```javascript
window.SpaceFlow.exportSVG()
```

**Caractéristiques :**
- Format vectoriel indépendant de la résolution
- Éditable dans Illustrator, Inkscape, etc.
- Inclut la géométrie complète avec les transformations de caméra
- Conserve les couleurs et l'ordre Z

---

### `window.SpaceFlow.exportPNG()`

Exporte l'image actuelle en image raster PNG.

**Utilisation :**
```javascript
window.SpaceFlow.exportPNG()
```

**Caractéristiques :**
- Inclut l'image de superposition si active
- Prend en charge l'export stéréoscopique (côte à côte)
- Dépend de la résolution du canvas
- Support du mode framebuffer

---

### `window.SpaceFlow.exportDepthMap()`

Exporte la carte de profondeur (visualisation du Z-buffer).

**Utilisation :**
```javascript
window.SpaceFlow.exportDepthMap()
```

**Sortie :**
- PNG en niveaux de gris où luminosité = distance de la caméra
- Noir = le plus proche, Blanc = le plus éloigné
- Plage automatique pour un contraste optimal

---

### `window.SpaceFlow.startVideoRecording()`

Commence la capture vidéo.

**Utilisation :**
```javascript
window.SpaceFlow.startVideoRecording()
```

**Paramètres :**
- Durée : `window.SpaceFlow.params.videoDuration` (secondes)
- FPS : `window.SpaceFlow.params.videoFPS`
- Format : `window.SpaceFlow.params.videoFormat` (`'webm'`)

---

### `window.SpaceFlow.stopVideoRecording()`

Arrête prématurément la capture vidéo.

**Utilisation :**
```javascript
window.SpaceFlow.stopVideoRecording()
```

---

### `window.SpaceFlow.isVideoRecording()`

Vérifie si l'enregistrement vidéo est actif.

**Utilisation :**
```javascript
if (window.SpaceFlow.isVideoRecording()) {
  console.log('Enregistrement en cours...');
}
```

---

## Gestion des États

### `window.SpaceFlow.stateManager`

Accès au système de gestion des états.

#### Sauvegarder l'État Actuel

```javascript
// Sauvegarder les paramètres actuels en tant que nouvel état
window.SpaceFlow.stateManager.save('Mon Nom d\'État')
```

#### Charger un État

```javascript
// Charger un état par ID (avec transition)
window.SpaceFlow.stateManager.load('state-id-1234')

// Charger un état instantanément (sans transition)
window.SpaceFlow.stateManager.load('state-id-1234', true)
```

#### Mettre à Jour un État

```javascript
// Mettre à jour un état existant avec les paramètres actuels
window.SpaceFlow.stateManager.update('state-id-1234')
```

#### Supprimer un État

```javascript
window.SpaceFlow.stateManager.delete('state-id-1234')
```

#### Renommer un État

```javascript
window.SpaceFlow.stateManager.rename('state-id-1234', 'Nouveau Nom')
```

#### Lister Tous les États

```javascript
const states = window.SpaceFlow.stateManager.getAllStates()
console.table(states.map(s => ({ id: s.id, name: s.name })))
```

#### Charger un État Aléatoire

```javascript
// Charge un état aléatoire (sauf l'actuel)
window.SpaceFlow.stateManager.loadRandomState()
```

#### Naviguer dans l'Historique des États

```javascript
// Aller à l'état précédent dans l'historique
window.SpaceFlow.stateManager.navigateHistory(-1)

// Aller à l'état suivant dans l'historique
window.SpaceFlow.stateManager.navigateHistory(1)
```

#### Exporter un État

```javascript
// Exporter un seul état vers un fichier JSON
window.SpaceFlow.stateManager.exportState('state-id-1234')

// Exporter tous les états vers un fichier JSON
window.SpaceFlow.stateManager.exportAll()
```

---

## Fonctions de Stockage

### `window.SpaceFlow.saveToLocalStorage()`

Sauvegarde les paramètres actuels dans le localStorage du navigateur.

**Utilisation :**
```javascript
window.SpaceFlow.saveToLocalStorage()
```

**Données sauvegardées :**
- Tous les paramètres de `window.SpaceFlow.params`
- Nom du projet
- Index de palette active

---

### `window.SpaceFlow.loadFromLocalStorage()`

Charge les paramètres depuis le localStorage du navigateur.

**Utilisation :**
```javascript
if (window.SpaceFlow.loadFromLocalStorage()) {
  console.log('Paramètres chargés depuis localStorage');
} else {
  console.log('Aucun paramètre sauvegardé trouvé');
}
```

---

### `window.SpaceFlow.downloadJSON()`

Télécharge le projet actuel sous forme de fichier JSON.

**Utilisation :**
```javascript
// Format standard (v2)
window.SpaceFlow.downloadJSON()

// Format legacy (v1)
window.SpaceFlow.downloadJSON('legacy')

// Nom de fichier personnalisé
window.SpaceFlow.downloadJSON('standard', 'mon-projet.json')
```

**Le fichier inclut :**
- Tous les paramètres
- Tous les états sauvegardés
- ID de l'état actif
- Métadonnées du projet

---

### `window.SpaceFlow.loadJSON(file)`

Charge un projet depuis un fichier JSON.

**Utilisation :**
```javascript
// Généralement déclenché via un input de fichier
// Mais peut être appelé programmatiquement avec un objet File
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', (e) => {
  window.SpaceFlow.loadJSON(e.target.files[0]);
});
```

---

## Contrôle Caméra

### Objet Camera

Accès via `window.SpaceFlow.camera`

```javascript
const cam = window.SpaceFlow.camera;

// État actuel de la caméra
console.log('Rotation X:', cam.rotationX);
console.log('Rotation Y:', cam.rotationY);
console.log('Distance:', cam.distance);
console.log('Décalage:', cam.offsetX, cam.offsetY);
```

### Réinitialiser la Caméra

```javascript
// Réinitialiser à la position par défaut
window.SpaceFlow.camera.rotationX = 0;
window.SpaceFlow.camera.rotationY = 0;
window.SpaceFlow.camera.distance = 600;
window.SpaceFlow.camera.offsetX = 0;
window.SpaceFlow.camera.offsetY = 0;
window.SpaceFlow.camera.syncToParams(window.SpaceFlow.params);
```

### Animer une Transition de Caméra

```javascript
// Transition vers une nouvelle position de caméra dans le temps
window.SpaceFlow.camera.transitionTo({
  rotationX: -0.5,
  rotationY: 0.3,
  distance: 800,
  offsetX: 0,
  offsetY: 0
});
```

---

## Système de Couleurs

### Déclencher un Changement de Palette

```javascript
// Basculer vers une palette par index (0-3)
window.SpaceFlow.params.activePaletteIndex = 2;
window.SpaceFlow.triggerPaletteChange();
```

### Accéder aux Palettes

```javascript
// Voir toutes les palettes
console.log(window.SpaceFlow.params.palettes);

// Obtenir la palette active
const activePalette = window.SpaceFlow.params.palettes[
  window.SpaceFlow.params.activePaletteIndex
];
console.log('Palette active:', activePalette);
```

### Modifier les Couleurs

```javascript
// Changer une couleur dans la palette 0, emplacement 0
window.SpaceFlow.params.palettes[0][0].rgb = [255, 100, 50];

// Déclencher une transition de palette pour voir les changements
window.SpaceFlow.triggerPaletteChange();
```

---

## Accès aux Paramètres

### Voir Tous les Paramètres

```javascript
// Afficher l'objet de paramètres complet
console.log(window.SpaceFlow.params);

// Afficher au format JSON
console.log(JSON.stringify(window.SpaceFlow.params, null, 2));
```

### Modifier les Paramètres

```javascript
const ZM = window.SpaceFlow;

// Géométrie
ZM.params.segmentLength = 150;
ZM.params.lineThickness = 30;
ZM.params.geometryScale = 120;

// Animation
ZM.params.emitRate = 2.5;
ZM.params.speed = 100;
ZM.params.ambientSpeedMaster = 80;

// Caméra
ZM.params.fov = 75;
ZM.params.cameraDistance = 800;

// Après modification des paramètres, synchroniser l'UI
if (ZM.syncUIFromParams) {
  ZM.syncUIFromParams();
}
```

### Interroger l'État du Canvas

```javascript
const ZM = window.SpaceFlow;

// Dimensions du canvas
console.log('Largeur:', ZM.W, 'Hauteur:', ZM.H);

// Mode de rendu
console.log('Mode stéréo:', ZM.params.stereoscopicMode);
console.log('Mode framebuffer:', ZM.params.framebufferMode);

// Info d'image
console.log('Sketch prêt:', ZM.sketchReady);
console.log('Instance p5:', !!ZM.p5Instance);
```

---

## Opérations Avancées

### Accéder à l'Émetteur

```javascript
const emitter = window.SpaceFlow.emitterInstance;

// Compter les lignes actives
console.log('Lignes actives:', emitter.lines.length);

// Obtenir le taux d'émission
console.log('Taux d\'émission:', emitter.params.emitRate);

// Accéder aux lignes individuelles
emitter.lines.forEach((line, i) => {
  console.log(`Ligne ${i}:`, {
    x: line.x,
    y: line.y,
    thickness: line.lineThickness,
    color: line.currentColor,
    age: line.age
  });
});
```

### Forcer la Régénération de Géométrie

```javascript
// Effacer toutes les lignes et redémarrer l'émission
const ZM = window.SpaceFlow;
if (ZM.emitterInstance) {
  ZM.emitterInstance.lines = [];
}
```

### Inspecter l'Instance p5.js

```javascript
// Accéder au contexte de dessin p5
const p = window.SpaceFlow.p5Instance;

if (p) {
  console.log('Nombre d\'images:', p.frameCount);
  console.log('Fréquence d\'images:', p.frameRate());
  console.log('Canvas:', p.canvas);
}
```

### Réinitialisation Manuelle du Sketch

```javascript
// Réinitialiser les sketches (avancé)
window.SpaceFlow.initializeSketches();
```

### Accéder aux Classes de Base

```javascript
// Créer une ligne zigzag personnalisée
const ZM = window.SpaceFlow;
const line = new ZM.ZigzagLine({
  p: ZM.p5Instance,
  x: ZM.W / 2,
  y: ZM.H / 2,
  segmentLength: 120,
  lineThickness: 24,
  lineColor: [255, 255, 255],
  colorSlotIndex: 0,
  vy: -80,
  canvasWidth: ZM.W,
  canvasHeight: ZM.H,
  params: ZM.params,
  getSpawnDistanceFn: ZM.getSpawnDistance,
  buildRibbonSidesFn: ZM.buildRibbonSides
});

// Ajouter à l'émetteur
ZM.emitterInstance.lines.push(line);
```

---

## Commandes Utilitaires

### Effacer le localStorage

```javascript
localStorage.removeItem('zigmap26Settings');
localStorage.removeItem('ZigMap26_states');
localStorage.removeItem('ZigMap26_activeState');
console.log('localStorage effacé');
```

### Vérifier le Support Navigateur

```javascript
// Vérifier le support WebGL
console.log('Support WebGL:', !!window.WebGLRenderingContext);

// Vérifier le support canvas
const testCanvas = document.createElement('canvas');
console.log('Support canvas:', !!testCanvas.getContext('2d'));

// Vérifier que p5.js est chargé
console.log('p5.js chargé:', typeof p5 !== 'undefined');
```

### Surveiller le Décalage de Bruit

```javascript
// Voir le décalage de bruit (temps d'animation)
console.log('Décalage de bruit:', window.SpaceFlow.noiseOffset);

// Réinitialiser le décalage de bruit (redémarre la séquence de bruit)
window.SpaceFlow.noiseOffset = 0;
```

---

## Conseils de Débogage

### 1. Inspecter l'État Actuel

```javascript
const ZM = window.SpaceFlow;
console.group('État Actuel de l\'Application');
console.log('Lignes actives:', ZM.emitterInstance.lines.length);
console.log('Canvas:', ZM.W, 'x', ZM.H);
console.log('Distance caméra:', ZM.camera.distance);
console.log('FOV:', ZM.params.fov);
console.log('Palette:', ZM.params.activePaletteIndex);
console.groupEnd();
```

### 2. Surveiller la Fréquence d'Images

```javascript
setInterval(() => {
  showPerformanceStats();
}, 5000); // Afficher les stats toutes les 5 secondes
```

### 3. Journaliser les Changements de Paramètres

```javascript
// Surveiller un paramètre spécifique
const originalValue = window.SpaceFlow.params.emitRate;
Object.defineProperty(window.SpaceFlow.params, 'emitRate', {
  get() { return originalValue; },
  set(val) {
    console.log('emitRate changé:', originalValue, '→', val);
    originalValue = val;
  }
});
```

### 4. Opérations par Lot

```javascript
// Exemple : Créer 10 états avec différentes vitesses
for (let i = 1; i <= 10; i++) {
  window.SpaceFlow.params.speed = i * 20;
  window.SpaceFlow.stateManager.save(`Vitesse ${i * 20}`);
}
```

---

## Référence Rapide

| Commande | Description |
|----------|-------------|
| `showPerformanceStats()` | Afficher les métriques de performance |
| `window.SpaceFlow` | Espace de noms global de l'application |
| `window.SpaceFlow.exportSVG()` | Exporter en graphique vectoriel |
| `window.SpaceFlow.exportPNG()` | Exporter en image raster |
| `window.SpaceFlow.exportDepthMap()` | Exporter la carte de profondeur |
| `window.SpaceFlow.stateManager.save(name)` | Sauvegarder l'état actuel |
| `window.SpaceFlow.stateManager.load(id)` | Charger un état par ID |
| `window.SpaceFlow.stateManager.loadRandomState()` | Charger un état aléatoire |
| `window.SpaceFlow.downloadJSON()` | Télécharger le fichier projet |
| `window.SpaceFlow.saveToLocalStorage()` | Sauvegarder dans le stockage navigateur |
| `window.SpaceFlow.loadFromLocalStorage()` | Charger depuis le stockage navigateur |
| `window.SpaceFlow.camera` | Accéder à l'objet caméra |
| `window.SpaceFlow.params` | Accéder à tous les paramètres |
| `window.SpaceFlow.emitterInstance` | Accéder à l'émetteur de particules |

---

## Voir Aussi

- [Manuel Utilisateur](User-Manual-fr.md) — Contrôles UI et raccourcis clavier
- [Documentation Technique](Documentation-fr.md) — Détails d'architecture
- [Format JSON des Préréglages](Preset-JSON-Format-fr.md) — Spécification du format de fichier

---

**Dernière Mise à Jour :** 28 mai 2026
