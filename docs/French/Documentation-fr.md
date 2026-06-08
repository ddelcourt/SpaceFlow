# SpaceFlow Framework — Documentation Technique
ddelcourt2026

**Version 26** - Architecture du Code & Guide d'Implémentation

**SpaceFlow** est un framework modulaire pour l'art génératif 3D en temps réel. Ce document couvre l'architecture du framework et l'implémentation du patch actuel.

🎭 **Patch Actuel :** Émetteur Zigzag (motifs de rubans animés 3D)

🔗 **Architecture Framework :** Voir [SPACEFLOW-ARCHITECTURE.md](../English/SPACEFLOW-ARCHITECTURE.md) pour la conception complète du framework

---

## Référence des Paramètres

Liste complète de tous les paramètres configurables dans l'objet `params` :

| Paramètre | Variable | Description |
|-----------|----------|-------------|
| **Géométrie** |||
| Longueur de Segment | `segmentLength` | Hauteur de chaque segment zigzag en pixels |
| Épaisseur de Ligne | `lineThickness` | Largeur du ruban en pixels |
| Rotation Émetteur | `emitterRotation` | Rotation de l'émetteur sur l'axe Z en degrés |
| Échelle Géométrie | `geometryScale` | Multiplicateur d'échelle uniforme en pourcentage (100 = normal) |
| Durée de Fondu | `fadeDuration` | Durée de la transition fondu entrant/sortant en secondes |
| **Palettes de Couleurs** |||
| Palettes | `palettes` | Tableau de 4 palettes, chacune contenant 4 couleurs avec valeurs RGB et rôle |
| Index Palette Active | `activePaletteIndex` | Palette actuellement sélectionnée (0-3) |
| Durée Transition Couleur | `colorTransitionDuration` | Temps en secondes pour les transitions de palette |
| Durée Transition État | `stateTransitionDuration` | Temps en secondes pour les transitions de géométrie, comportement, caméra et modulations |
| Décalage Z Plage Couleur | `colorSlotZOffset` | Multiplicateur de séparation sur l'axe Z par plage de couleur pour éviter le z-fighting |
| Graine Aléatoire Couleur | `colorRandomSeed` | Graine pour la sélection déterministe des couleurs (1-9999) |
| **Déclenchement Automatique d'États** |||
| Déclencher États Automatiquement | `autoTriggerStates` | Activer les changements d'état automatiques à intervalles spécifiés |
| Fréquence Déclenchement Auto | `autoTriggerFrequency` | Temps en secondes entre les changements d'état automatiques (5-240) |
| **Animation** |||
| Taux d'Émission | `emitRate` | Nombre de lignes générées par seconde |
| Vitesse | `speed` | Vitesse de déplacement de base des lignes en pixels par seconde |
| Maître Vitesse Ambiante | `ambientSpeedMaster` | Multiplicateur de vitesse globale en pourcentage |
| **Modulation** |||
| Épaisseur Aléatoire | `randomThickness` | Activer la variation d'épaisseur pour chaque ligne |
| Vitesse Aléatoire | `randomSpeed` | Activer la variation de vitesse pour chaque ligne |
| Épaisseur Plage Min | `thicknessRangeMin` | Multiplicateur d'épaisseur minimum en pourcentage |
| Épaisseur Plage Max | `thicknessRangeMax` | Multiplicateur d'épaisseur maximum en pourcentage |
| Vitesse Plage Min | `speedRangeMin` | Multiplicateur de vitesse minimum en pourcentage |
| Vitesse Plage Max | `speedRangeMax` | Multiplicateur de vitesse maximum en pourcentage |
| **Caméra** |||
| Champ de Vision | `fov` | Champ de vision de la caméra en degrés |
| Plan de Découpe Proche | `near` | Distance de découpe proche (0.01) |
| Plan de Découpe Lointain | `far` | Distance de découpe lointaine (5000) |
| Rotation Caméra X | `cameraRotationX` | Rotation sur l'axe X (tangage) en radians |
| Rotation Caméra Y | `cameraRotationY` | Rotation sur l'axe Y (lacet) en radians |
| Distance Caméra | `cameraDistance` | Distance depuis l'origine (zoom) |
| Décalage Caméra X | `cameraOffsetX` | Décalage de panoramique horizontal |
| Décalage Caméra Y | `cameraOffsetY` | Décalage de panoramique vertical |
| **Stéréoscopique** |||
| Mode Stéréoscopique | `stereoscopicMode` | Activer le rendu stéréo double caméra côte à côte |
| Séparation Oculaire | `eyeSeparation` | Distance entre les caméras gauche et droite |
| **Framebuffer** |||
| Mode Framebuffer | `framebufferMode` | Verrouiller le canevas à une résolution fixe indépendante de la taille de la fenêtre |
| Préréglage Framebuffer | `framebufferPreset` | Nom du préréglage de résolution (ex: '1920x1080') |
| Largeur Framebuffer | `framebufferWidth` | Largeur du canevas en pixels quand le mode framebuffer est actif |
| Hauteur Framebuffer | `framebufferHeight` | Hauteur du canevas en pixels quand le mode framebuffer est actif |
| Bordure Canevas Visible | `canvasBorderVisible` | Afficher/masquer la bordure du canevas |
| Couleur Bordure Canevas | `canvasBorderColor` | Couleur de bordure au format hexadécimal (ex: '#adff2f') |
| **Export Vidéo** |||
| Durée Vidéo | `videoDuration` | Durée d'enregistrement en secondes |
| FPS Vidéo | `videoFPS` | Fréquence d'images de l'enregistrement (images par seconde) |
| Format Vidéo | `videoFormat` | Format du codec vidéo (ex: 'webm') |
| **Export Carte de Profondeur** |||
| Inverser Profondeur | `depthInvert` | Inverser les couleurs de la carte de profondeur (blanc=loin, noir=près) |
| **Image de Superposition** |||
| Source Image Superposition | `overlayImageSrc` | URL source ou URL de données de l'image de superposition |
| Fichier Préréglage Superposition | `overlayPresetFile` | Nom du fichier de superposition préréglé sélectionné |
| Nom Fichier Personnalisé Superposition | `overlayCustomFilename` | Nom du fichier de superposition personnalisé téléchargé |
| Source Image Personnalisée Superposition | `overlayCustomImageSrc` | URL de données source de la superposition personnalisée téléchargée |
| Superposition Visible | `overlayVisible` | Afficher/masquer la superposition sur le canevas |
| Ajustement Auto Superposition | `overlayAutoFit` | Ajuster automatiquement la superposition aux dimensions du canevas |
| Échelle Superposition | `overlayScale` | Multiplicateur de taille de la superposition en pourcentage |
| Opacité Superposition | `overlayOpacity` | Transparence de la superposition en pourcentage (0-100) |
| Superposition X | `overlayX` | Position horizontale en pourcentage (0-100) |
| Superposition Y | `overlayY` | Position verticale en pourcentage (0-100) |

---

## Table des Matières

- [Vue d'Ensemble de l'Architecture](#vue-densemble-de-larchitecture)
- [Stack Technologique](#stack-technologique)
- [Structure des Fichiers](#structure-des-fichiers)
- [Concepts Fondamentaux](#concepts-fondamentaux)
- [Structures de Données](#structures-de-données)
- [Référence des Classes](#référence-des-classes)
- [Référence des Fonctions](#référence-des-fonctions)
- [Pipeline de Rendu](#pipeline-de-rendu)
- [Système de Caméra](#système-de-caméra)
- [Système d'Incrustation](#système-dincrustation)
- [Système d'Export](#système-dexport)
- [Gestion d'État](#gestion-détat)
- [Gestion des Événements](#gestion-des-événements)
- [Considérations de Performance](#considérations-de-performance)
- [Guide d'Extension](#guide-dextension)
- [Débogage](#débogage)

---

## Vue d'Ensemble de l'Architecture

L'Émetteur Zigzag suit une **architecture modulaire ES6** avec une séparation claire des responsabilités via des fichiers dédiés à chaque composant majeur. L'application est structurée comme suit :

```mermaid
graph TB
    HTML["Structure HTML & CSS<br/>(Contrôles UI, Mise en page, Style)"]
    
    HTML --> Main
    
    subgraph JS["Application JavaScript"]
        Main["Point d'Entrée (main.js)<br/>• Initialisation<br/>• Chargement preset premier lancement<br/>• Orchestration des modules"]
        
        Main --> Config
        
        Config["Couche Configuration<br/>• constants.js (Constantes système)<br/>• defaults.js (Paramètres par défaut)"]
        
        Config --> Core
        
        Core["Classes Principales<br/>• ZigzagLine (Géométrie de ligne)<br/>• Emitter (Gestion du pool de lignes)<br/>• Camera (Position & projection)<br/>• Projection (Matrices de transform)"]
        
        Core --> Render
        
        Render["Couche Rendu<br/>• SketchFactory (Instances p5.js)"]
        
        Render --> Export
        
        Export["Système d'Export<br/>• PNGExporter (Composite canevas)<br/>• SVGExporter (Export vectoriel)<br/>• DepthExporter (Cartes de profon.)<br/>• VideoRecorder (CCapture.js)"]
        
        Export --> Storage
        
        Storage["Couche Stockage & État<br/>• StateManager (Capture/restauration)<br/>• localStorage (Persistance)"]
        
        Storage --> Input
        
        Input["Gestionnaires d'Entrée<br/>• KeyboardHandler (Raccourcis)<br/>• MouseHandler (Contrôles orbite)"]
        
        Input --> UI
        
        UI["Couche UI<br/>• UIController (Câblage contrôles)"]
    end
    
    style HTML fill:#2d3748,stroke:#4299e1,color:#fff
    style JS fill:#1a202c,stroke:#4299e1,color:#fff
    style Main fill:#2c5282,stroke:#90cdf4,color:#fff
    style Core fill:#2c5282,stroke:#90cdf4,color:#fff
    style Export fill:#22543d,stroke:#68d391,color:#fff
```

### Modèles de Conception

1. **Modèle Module ES6** : Chaque classe/système dans un fichier séparé avec imports/exports explicites
2. **Modèle Factory** : `SketchFactory.js` génère les instances p5.js
3. **Modèle Observer** : Les contrôles UI mettent à jour l'objet `params`, déclenchant les rendus
4. **Modèle Singleton** : Instance unique d'`Emitter` partagée entre les vues stéréo
5. **Modèle Stratégie** : Multiples exporteurs avec interface commune
6. **Synchronisation Bidirectionnelle** : La classe `Camera` synchronise dans les deux sens avec `params`

---

## Stack Technologique

### Bibliothèques Principales

- **[p5.js](https://p5js.org/) v1.9.0**
  - Framework de codage créatif
  - Fournit un moteur de rendu WebGL et la gestion du canevas
  - Gère le dessin, les transformations et la projection en perspective
  
- **[CCapture.js](https://github.com/spite/ccapture.js/) v1.1.0**
  - Capture vidéo image par image
  - Rendu déterministe pour une sortie cohérente
  - Support WebM et autres formats

### APIs du Navigateur

- **API Canvas 2D** : Export PNG via `toDataURL()`
- **WebGL** : Rendu 3D accéléré par matériel via p5.js
- **LocalStorage** : Persistance des paramètres
- **API File** : Import/export de configuration JSON
- **API Fullscreen** : Bascule du mode plein écran

### Fonctionnalités du Langage

- **JavaScript ES6+**
  - **Modules ES6** avec import/export
  - Classes et constructeurs
  - Fonctions fléchées
  - Async/await pour le chargement des presets
  - Affectation par décomposition
  - Littéraux de modèle
  - Opérateur de propagation
  - Portée de bloc `const`/`let`

---

## Structure des Fichiers

```
index.html                          (Point d'entrée HTML principal)
├── config/
│   ├── appInfo.json               (Métadonnées de l'application)
│   ├── keyboardShortcuts.json     (Mappages clavier)
│   ├── uiPresets.json             (Configuration UI)
│   ├── overlayPresets.js          (Liste des fichiers overlay)
│   └── presets/
│       ├── manifest.json          (Registre des presets)
│       └── Init.json              (Preset premier lancement)
├── css/
│   ├── main.css                   (Styles de base)
│   ├── controls.css               (Style du panneau de contrôle)
│   ├── canvas.css                 (Conteneur canevas)
│   └── states.css                 (UI gestion des états)
├── js/
│   ├── main.js                    (Point d'entrée & initialisation)
│   ├── config/
│   │   ├── constants.js           (Constantes système)
│   │   └── defaults.js            (Paramètres par défaut)
│   ├── core/
│   │   ├── ZigzagLine.js          (Géométrie & comportement de ligne)
│   │   ├── Emitter.js             (Gestion du pool de lignes)
│   │   ├── Camera.js              (Position caméra & sync)
│   │   ├── Projection.js          (Matrices de projection)
│   │   ├── colorUtils.js          (Manipulation des couleurs)
│   │   └── utils.js               (Utilitaires mathématiques)
│   ├── rendering/
│   │   └── SketchFactory.js       (Création de sketch p5.js)
│   ├── export/
│   │   ├── PNGExporter.js         (PNG avec composite overlay)
│   │   ├── SVGExporter.js         (Export vectoriel)
│   │   ├── DepthExporter.js       (Export carte de profondeur)
│   │   └── VideoRecorder.js       (Vidéo avec overlay)
│   ├── storage/
│   │   ├── StateManager.js        (Capture/restauration d'état)
│   │   └── localStorage.js        (Couche persistance)
│   ├── input/
│   │   ├── KeyboardHandler.js     (Raccourcis clavier)
│   │   └── MouseHandler.js        (Contrôles orbite)
│   └── ui/
│       └── UIController.js        (Câblage du panneau de contrôle)
```

---

## Concepts Fondamentaux

### 1. Systèmes de Coordonnées

L'application utilise trois systèmes de coordonnées :

#### Espace Écran
- Origine : Coin supérieur gauche
- Unités : Pixels
- Plage : `[0, W)` × `[0, H)`
- Utilisé pour : Entrée souris, éléments UI

#### Espace Canevas
- Origine : Centre du canevas
- Unités : Pixels
- Plage : `[-W/2, W/2)` × `[-H/2, H/2)`
- Utilisé pour : Génération de géométrie 2D, limites de génération

#### Espace Monde
- Origine : Centre de la scène (après transformations)
- Unités : Arbitraires (mis à l'échelle par `geometryScale`)
- Utilisé pour : Rendu 3D, transformations de caméra
- Transformations appliquées : Translation, rotation, échelle

### 2. Modes de Rendu

#### Monoscopique (Défaut)
- Canevas unique remplissant la fenêtre
- Rendu en perspective standard
- Bordure gris foncé (1px)

#### Stéréoscopique (Mode VR)
- Deux canevas côte à côte (œil gauche/droit)
- Chaque canevas : largeur W/2
- Caméra décalée de `±eyeSeparation/2` le long de l'axe X
- Bordures vertes indiquant le mode stéréo
- Animation synchronisée via `sharedLastTime`

#### Mode Framebuffer
- Résolution fixe indépendante de la taille de la fenêtre
- Canevas mis à l'échelle pour s'adapter à la fenêtre
- Active l'export au pixel près
- Bordure gris foncé autour du canevas fixe

### 3. Boucle d'Animation

Cycle de mise à jour image par image :

```
1. Effacer l'arrière-plan (noir)
2. Mettre à jour la caméra depuis l'entrée souris
3. Calculer le temps delta (dt)
4. Mettre à jour l'émetteur (générer nouvelles lignes, déplacer existantes)
5. Appliquer les transformations de caméra (translation, rotation, perspective)
6. Dessiner toutes les lignes zigzag
7. (Si enregistrement) Capturer l'image pour l'encodeur vidéo
```

### 4. Génération de Géométrie

Les motifs zigzag sont générés comme :

1. **Ligne centrale** : Série de points formant le chemin zigzag
2. **Décalage de ruban** : Décalages perpendiculaires créant l'épaisseur
3. **Joints en onglet** : Connexions lisses aux sommets
4. **Embouts** : Capuchons verticaux plats au début/fin
5. **Construction de maillage** : Bande de quads depuis les côtés gauche/droit

---

## Structures de Données

### Objet `params`

Objet de configuration central stockant tous les paramètres ajustables.

```javascript
const params = {
  // Géométrie
  segmentLength: 120,        // Hauteur de chaque segment zigzag (px)
  lineThickness: 12,         // Largeur du ruban (px)
  emitterRotation: 0,        // Rotation axe Z (degrés)
  geometryScale: 100,        // Échelle uniforme (%)
  fadeDuration: 0.8,         // Durée de fondu d'entrée/sortie (secondes)
  
  // Palettes de Couleurs
  palettes: [                // 4 palettes × 4 couleurs chacune
    [
      { rgb: [255, 255, 255], role: 'line' },
      { rgb: [200, 200, 255], role: 'line' },
      { rgb: [255, 200, 200], role: 'line' },
      { rgb: [200, 255, 200], role: 'none' }
    ],
    // ... palettes 2-4
  ],
  activePaletteIndex: 0,     // Palette actuellement sélectionnée (0-3)
  colorTransitionDuration: 3.0,  // Temps de transition de palette (secondes)
  colorSlotZOffset: 100,     // Multiplicateur de séparation Z pour emplacements de couleur
  
  // Animation
  emitRate: 1.5,             // Lignes générées par seconde
  speed: 80,                 // Vitesse de mouvement de base (px/s)
  
  // Caméra
  fov: 60,                   // Champ de vision (degrés)
  near: 0.01,                // Plan de découpe proche
  far: 5000,                // Plan de découpe lointain
  cameraRotationX: -0.3,     // Rotation axe X (radians)
  cameraRotationY: 0,        // Rotation axe Y (radians)
  cameraDistance: 600,       // Distance depuis l'origine
  cameraOffsetX: 0,          // Décalage de déplacement X
  cameraOffsetY: 0,          // Décalage de déplacement Y
  
  // Modulation
  randomThickness: false,    // Activer variation d'épaisseur
  randomSpeed: false,        // Activer variation de vitesse
  thicknessRangeMin: 10,     // Multiplicateur d'épaisseur min (%)
  thicknessRangeMax: 200,    // Multiplicateur d'épaisseur max (%)
  speedRangeMin: 50,         // Multiplicateur de vitesse min (%)
  speedRangeMax: 150,        // Multiplicateur de vitesse max (%)
  ambientSpeedMaster: 100,   // Multiplicateur de vitesse global (%)
  
  // Rendu
  stereoscopicMode: false,   // Activer stéréo double caméra
  eyeSeparation: 30,         // Distance entre caméras
  framebufferMode: false,    // Verrouiller à résolution fixe
  framebufferPreset: '1920x1080',  // Nom du préréglage de résolution
  framebufferWidth: 1920,    // Largeur du canevas (px)
  framebufferHeight: 1080,   // Hauteur du canevas (px)
  
  // Export
  videoDuration: 10,         // Longueur d'enregistrement (secondes)
  videoFPS: 30,              // Fréquence d'images d'enregistrement
  videoFormat: 'webm'        // Codec vidéo
};
```
  videoFPS: 30,              // Fréquence d'images d'enregistrement
  videoFormat: 'webm'        // Codec vidéo
};
```

### Objet `camera`

État de la caméra indépendant de `params` pour éviter les mises à jour circulaires.

```javascript
const camera = {
  rotationX: -0.3,     // Tangage (radians)
  rotationY: 0,        // Lacet (radians)
  distance: 600,       // Distance de zoom
  offsetX: 0,          // Décalage de déplacement X
  offsetY: 0,          // Décalage de déplacement Y
  isDragging: false,   // Glissement clic gauche actif
  isPanning: false,    // Glissement clic droit actif
  lastMouseX: 0,       // X souris précédent (pour delta)
  lastMouseY: 0        // Y souris précédent (pour delta)
};
```

### Constantes

```javascript
export const SEGMENTS = 16;                // Sommets zigzag par ligne
export const STORAGE_KEY = 'zigmap26Settings';  // Clé LocalStorage
```

### État Global de l'Application (`window.SpaceFlow`)

Tout l'état partagé réside dans le namespace `window.SpaceFlow`, initialisé dans `js/main.js` :

```javascript
window.SpaceFlow = {
  params: { ...DEFAULT_PARAMS },   // Tous les paramètres ajustables
  SEGMENTS,                         // Sommets zigzag par ligne
  STORAGE_KEY,                      // Clé LocalStorage
  noiseOffset: 0,                   // Décalage temporel du bruit de Perlin
  W: window.innerWidth,             // Largeur logique du canevas
  H: window.innerHeight,            // Hauteur logique du canevas
  camera: null,                     // Instance Camera
  p5Instance: null,                 // Instance de sketch p5 primaire
  p5InstanceRight: null,            // Instance secondaire (droite stéréo)
  emitterInstance: null,            // Objet Emitter partagé
  sketchReady: false,               // Si le sketch est initialisé
  stateManager: null,               // Instance StateManager
};
```

---

## Référence des Classes

### `ZigzagLine`

Représente un seul ruban zigzag animé.

#### Constructeur

```javascript
constructor({ p, x, y, segmentLength, lineThickness, lineColor, colorSlotIndex, vy,
              canvasWidth, canvasHeight, params, getSpawnDistanceFn, buildRibbonSidesFn })
```

**Paramètres :**
- `p` (p5) : Référence à l'instance p5.js
- `x` (Number) : Position X initiale (espace canevas)
- `y` (Number) : Position Y initiale (espace canevas)
- `segmentLength` (Number) : Hauteur de chaque segment
- `lineThickness` (Number) : Largeur du ruban
- `lineColor` (Array) : Tableau RGB `[r, g, b]`
- `colorSlotIndex` (Number) : Index de l'emplacement de palette (0–3) pour calcul Z-offset
- `vy` (Number) : Vélocité en direction Y (px/s, négatif = vers le haut)
- `canvasWidth` (Number) : Largeur actuelle du canevas en pixels
- `canvasHeight` (Number) : Hauteur actuelle du canevas en pixels
- `params` (Object) : Référence à l'objet `params` global
- `getSpawnDistanceFn` (Function) : Fonction utilitaire pour calculer les limites de génération
- `buildRibbonSidesFn` (Function) : Fonction utilitaire pour construire la géométrie du ruban

**Propriétés :**
- `segments` (Number) : Toujours 16
- `step` (Number) : Distance de pas diagonal = `segmentLength / √2`
- `totalWidth` (Number) : Largeur horizontale totale = `segments × step`
- `alive` (Boolean) : Si la ligne est toujours visible
- `age` (Number) : Secondes depuis la génération
- `currentColor` (Array) : Couleur RGB actuelle `[r, g, b]`
- `startColor` (Array) : Couleur au début de la transition
- `targetColor` (Array) : Couleur à la fin de la transition
- `colorTransitionProgress` (Number) : Progression de transition (0-1)
- `isTransitioning` (Boolean) : Si en transition active
- `colorSlotIndex` (Number) : Index (0-3) pour calcul de Z-offset
- `zOffset` (Number) : Décalage de profondeur axe Z = `(colorSlotIndex - 2) × params.colorSlotZOffset`

#### Méthodes

##### `_buildVertices()`

Génère les points de ligne centrale pour le motif zigzag.

**Retourne :** `Array<{x, y}>` - Tableau de points 2D dans l'espace local

**Algorithme :**
1. Commencer au bord gauche : `x = -totalWidth / 2, y = 0`
2. Pour chaque segment :
   - Déplacer à droite de `step`
   - Alterner déplacement haut/bas de `step`
3. Produit un motif zigzag horizontal

##### `update(dt)`

Met à jour la position et vérifie si la ligne doit être éliminée.

**Paramètres :**
- `dt` (Number) : Temps delta en secondes

**Logique :**
1. Incrémenter l'âge de `dt`
2. Déplacer position Y de `vy × dt`
3. Convertir en espace monde : `worldY = y - H/2`
4. Vérifier si hors des limites de génération, définir `alive = false` si oui

##### `_alpha()`

Calcule l'opacité combinée du fondu d'entrée et de sortie.

**Retourne :** `Number` - Valeur alpha dans la plage [0, 1]

**Algorithme :**
1. **Fondu d'entrée** : `min(age / params.fadeDuration, 1)`
2. **Fondu de sortie** :
   - Calculer le temps restant avant atteinte de la limite de génération
   - `min(tempsrésidu / params.fadeDuration, 1)` où `tempsRésidu = distLimite / |vy|`
3. Retourner le minimum du fondu d'entrée et de sortie

##### `draw(p)`

Rend la ligne zigzag comme une forme remplie.

**Paramètres :**
- `p` (p5) : Instance p5.js

**Étapes :**
1. Calculer alpha (plage 0-255)
2. Construire géométrie du ruban via `buildRibbonSides()`
3. Push matrice (sauvegarder état de transformation)
4. Translater à la position monde de la ligne
5. Définir couleur de remplissage avec alpha
6. Dessiner forme :
   - Boucle de sommets pour côté gauche
   - Boucle de sommets inversée pour côté droit
   - Fermer forme pour former polygone
7. Pop matrice (restaurer état de transformation)

---

### `Emitter`

Gère la génération et la mise à jour de toutes les lignes zigzag.

#### Constructeur

```javascript
constructor({ p, x, y, params, noiseOffsetGetter,
              canvasWidth, canvasHeight, getSpawnDistanceFn, buildRibbonSidesFn })
```

**Paramètres :**
- `p` (p5) : Référence à l'instance p5.js
- `x` (Number) : Position de génération X (espace canevas)
- `y` (Number) : Position de génération Y (espace canevas)
- `params` (Object) : Référence à l'objet `params` global
- `noiseOffsetGetter` (Function) : Retourne le décalage temporel de bruit de Perlin actuel
- `canvasWidth` (Number) : Largeur actuelle du canevas en pixels
- `canvasHeight` (Number) : Hauteur actuelle du canevas en pixels
- `getSpawnDistanceFn` (Function) : Fonction utilitaire pour calculer les limites de génération
- `buildRibbonSidesFn` (Function) : Fonction utilitaire pour construire la géométrie du ruban
- `y` (Number) : Position de génération Y (espace canevas)

**Propriétés :**
- `lines` (Array) : Collection d'instances `ZigzagLine`
- `accumulator` (Number) : Tampon temporel pour le timing d'émission

#### Méthodes

##### `update(dt)`

Met à jour toutes les lignes et en génère de nouvelles selon le taux d'émission.

**Paramètres :**
- `dt` (Number) : Temps delta en secondes

**Algorithme :**
1. Ajouter `dt` à l'accumulateur
2. Calculer taux d'émission effectif : `emitRate × (ambientSpeedMaster / 100)`
3. Calculer intervalle de génération : `1 / effectiveRate`
4. Tant que accumulateur ≥ intervalle :
   - Soustraire intervalle de l'accumulateur
   - Appeler `_emit()` pour générer nouvelle ligne
5. Mettre à jour toutes les lignes existantes
6. Filtrer les lignes mortes (`alive === false`)

##### `_emit()`

Génère une seule nouvelle ligne zigzag.

**Algorithme :**
1. **Calcul d'épaisseur :**
   - Commencer avec `params.lineThickness`
   - Si `randomThickness` activé :
     - Échantillonner bruit de Perlin : `noise(noiseOffset)`
     - Échantillonner onde sinusoïdale : `sin(noiseOffset × 2)`
     - Mélanger : `variation = noise × 0.7 + sine × 0.3`
     - Mapper à la plage : `[thicknessRangeMin%, thicknessRangeMax%]`
     - Multiplier par épaisseur de base

2. **Calcul de vitesse :**
   - Commencer avec `params.speed`
   - Si `randomSpeed` activé :
     - Mélange similaire bruit + sinusoïde
     - Mapper à la plage : `[speedRangeMin%, speedRangeMax%]`
     - Multiplier par vitesse de base
   - Appliquer maître ambiant : `speed × ambientSpeedMaster / 100`

3. **Créer ligne :**
   - Instancier `ZigzagLine` avec valeurs calculées
   - Vélocité négative (mouvement vers le haut)
   - Ajouter au tableau `lines`

##### `draw(p)`

Rend toutes les lignes.

**Paramètres :**
- `p` (p5) : Instance p5.js

**Implémentation :**
```javascript
for (const line of this.lines) {
  line.draw(p);
}
```

---

## Référence des Fonctions

### Fonctions d'Aide

#### `getSpawnDistance()`

Calcule la demi-largeur du champ de génération.

**Retourne :** `Number` - Distance en pixels

**Formule :**
```javascript
const step = params.segmentLength / Math.SQRT2;
return (SEGMENTS × step) / 2;
```

**But :** Détermine quand les lignes doivent être éliminées (vérification des limites).

---

#### `buildRibbonSides(points, halfWidth)`

Convertit une polyligne en chemins décalés pour le rendu de ruban.

**Paramètres :**
- `points` (Array) : Sommets de ligne centrale `[{x, y}, ...]`
- `halfWidth` (Number) : Moitié de l'épaisseur de ruban désirée

**Retourne :** `Object` - `{ leftSide: [{x,y}, ...], rightSide: [{x,y}, ...] }`

**Algorithme :**

**Pour les extrémités (premier/dernier) :**
- Capuchons verticaux plats
- `leftSide` : `{x: curr.x, y: curr.y + halfWidth}`
- `rightSide` : `{x: curr.x, y: curr.y - halfWidth}`

**Pour les points intermédiaires :**
1. Obtenir segments adjacents :
   - Précédent : `(prev → curr)`
   - Suivant : `(curr → next)`
2. Calculer vecteurs perpendiculaires (normalisés) :
   - `perp1 = normalize([-dy1, dx1])`
   - `perp2 = normalize([-dy2, dx2])`
3. Moyenner perpendiculaires (direction onglet) :
   - `perp = normalize((perp1 + perp2) / 2)`
4. Décaler point de `perp × halfWidth`

**But :** Utilisé à la fois par le rendu canevas et l'export SVG pour une géométrie cohérente.

---

### Cycle de Vie du Sketch

#### `createSketch(ZM, eyeOffset, canvasId)` (`js/rendering/SketchFactory.js`)

Fonction factory qui retourne une fonction de sketch p5.js.

**Paramètres :**
- `ZM` (Object) : L'objet d'état global `window.SpaceFlow`
- `eyeOffset` (Number) : Décalage caméra axe X pour stéréo (0 pour mono, ±eyeSeparation pour stéréo)
- `canvasId` (String) : ID d'élément DOM pour attacher le canevas (`'mono-canvas'`, `'left-canvas'`, `'right-canvas'`)

**Retourne :** `Function` — Fonction de sketch p5.js (à passer à `new p5(...)`)

**Structure :**

```javascript
return function(p) {
  let emitter;        // Référence émetteur local ou partagé
  let lastTime;       // Timing d'image
  
  p.setup = function() { /* ... */ };
  p.draw = function() { /* ... */ };
  p.mouseWheel = function(event) { /* ... */ };
  p.windowResized = function() { /* ... */ };
};
```

##### `p.setup()`

Phase d'initialisation appelée une fois.

**Étapes :**
1. Définir densité de pixels à 1 (performance)
2. Créer canevas WebGL : `createCanvas(W, H, WEBGL)`
3. Attacher canevas à l'élément DOM parent
4. Initialiser ou référencer émetteur partagé
5. Configurer gestionnaires d'événements souris :
   - **contextmenu** : Empêcher menu clic droit
   - **mousePressed** : Détecter clic gauche/droit, définir états caméra
   - **mouseReleased** : Effacer drapeaux glissement/déplacement
6. Appliquer dimensionnement framebuffer si nécessaire
7. Initialiser `lastTime` pour calcul delta

**Événements Souris :**

```javascript
cnv.mousePressed((event) => {
  if (p.mouseButton === p.LEFT) {
    camera.isDragging = true;
    camera.isPanning = false;
  } else if (p.mouseButton === p.RIGHT || p.mouseButton === p.CENTER) {
    camera.isPanning = true;
    camera.isDragging = false;
  }
  camera.lastMouseX = p.mouseX;
  camera.lastMouseY = p.mouseY;
  return false;  // Empêcher défaut
});
```

##### `p.draw()`

Boucle de rendu principale appelée chaque image.

**Étapes de Rendu :**

1. **Effacer image :**
   ```javascript
   p.background(0);  // Noir
   ```

2. **Contrôles caméra (si canevas actif) :**
   - Calculer delta souris : `dx = mouseX - lastMouseX`
   - Si glissement (bouton gauche) :
     - Mettre à jour rotation : `rotationY += dx × 0.005`
     - Contraindre tangage : `rotationX = constrain(rotationX + dy × 0.005, -π/2, π/2)`
   - Si déplacement (bouton droit) :
     - Calculer sensibilité : `sens = max(0.5, distance / 500)`
     - Mettre à jour décalages : `offsetX += dx × sens`
   - Sauvegarder dans params et localStorage

3. **Définir projection en perspective :**
   ```javascript
   p.perspective(
     fov × π / 180,           // Champ de vision (radians)
     W / H,                   // Ratio d'aspect
     max(0.01, params.near),  // Plan de découpe proche
     params.far               // Plan de découpe lointain
   );
   ```

4. **Calculer temps delta :**
   - **Normal** : `dt = (millis() - lastTime) / 1000`
   - **Enregistrement** : `dt = 1 / fps` (pas de temps fixe)
   - **Stéréo** : Primaire calcule, secondaire utilise 0

5. **Appliquer transformation caméra :**
   ```javascript
   p.push();
   if (stereo) p.translate(cameraOffset, 0, 0);  // Séparation des yeux
   p.translate(camera.offsetX, camera.offsetY, 0);  // Déplacement
   p.translate(0, 0, -camera.distance);             // Zoom
   p.rotateX(camera.rotationX);                     // Tangage
   p.rotateY(camera.rotationY);                     // Lacet
   p.rotateZ(emitterRotation × π / 180);            // Rotation Z
   p.scale(geometryScale / 100);                    // Échelle uniforme
   ```

6. **Mettre à jour simulation (primaire seulement) :**
   ```javascript
   if (!stereoscopicMode || isPrimary) {
     noiseOffset += dt × 4;
     emitter.update(dt);
   }
   ```

7. **Dessiner émetteur :**
   ```javascript
   emitter.draw(p);
   ```

8. **Restaurer transformation :**
   ```javascript
   p.pop();
   ```

##### `p.mouseWheel(event)`

Gère le zoom via la molette de défilement.

**Paramètres :**
- `event` (Object) : Événement molette souris avec propriété `delta`

**Logique :**
1. Vérifier si le panneau de contrôles devrait défiler à la place
2. Mettre à jour distance : `distance = clamp(distance + delta × 20, 50, 10000)`
3. Sauvegarder dans params et localStorage
4. Retourner `false` pour empêcher défilement de page

##### `p.windowResized()`

Gère le redimensionnement de fenêtre du navigateur.

**Implémentation :**
```javascript
if (!isRecording) {
  updateCanvasSize();
}
```

**Note :** Ignore redimensionnement pendant enregistrement pour maintenir sortie cohérente.

---

### Fonctions d'Initialisation

#### `initializeSketches()`

Crée ou recrée les instances p5.js selon le mode actuel.

**Logique :**

1. **Nettoyage :**
   - Supprimer instances p5 existantes
   - Effacer HTML du wrapper de canevas
   - Réinitialiser état partagé

2. **Calculer dimensions :**
   - **Mode framebuffer** : Utiliser `framebufferWidth/Height`
   - **Stéréoscopique** : Chaque canevas obtient `windowWidth / 2`
   - **Monoscopique** : `windowWidth` complet

3. **Configuration stéréoscopique :**
   - Créer conteneur stéréo avec divs œil gauche/droite
   - Instancier deux sketches p5 :
     - Gauche : `cameraOffset = -eyeSeparation`
     - Droite : `cameraOffset = +eyeSeparation`
   - Partager émetteur unique entre les deux

4. **Configuration monoscopique :**
   - Créer div de canevas unique
   - Instancier un sketch p5
   - `cameraOffset = 0`

5. **Post-traitement :**
   - Appeler `updateCanvasSize()` pour mode framebuffer
   - Léger délai (50ms) pour assurer mise à jour DOM

---

#### `updateCanvasSize()`

Ajuste la résolution et l'échelle du canevas.

**Gardes :**
- Ignorer si pas d'instance p5
- Ignorer si déjà en mise à jour (empêcher récursion)

**Mode Framebuffer :**
1. Définir dimensions à `framebufferWidth/Height`
2. Calculer échelle pour ajuster fenêtre : `min(windowW / canvasW, windowH / canvasH, 1)`
3. Redimensionner canevas à résolution cible
4. Appliquer transformation d'échelle CSS si nécessaire
5. Définir taille du wrapper explicitement
6. Ajouter classe framebuffer-mode (bordure gris foncé)

**Mode Ajustement Fenêtre :**
1. Calculer dimensions :
   - Stéréo : `W = windowWidth / 2`
   - Mono : `W = windowWidth`
   - `H = windowHeight`
2. Redimensionner canevas pour ajuster fenêtre
3. Supprimer transformations CSS
4. Définir wrapper à taille 100%
5. Supprimer classe framebuffer-mode

**Mise à Jour Émetteur :**
- Repositionner émetteur au centre du canevas : `(W/2, H/2 + getSpawnDistance())`

---

### Gestion d'État

#### `saveToLocalStorage()`

Persiste les `params` actuels dans le localStorage du navigateur.

**Implémentation :**
```javascript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
} catch(e) {
  console.warn('Échec sauvegarde localStorage:', e);
}
```

**Déclencheur :** Appelé après chaque changement de paramètre.

---

#### `loadFromLocalStorage()`

Charge les paramètres sauvegardés depuis localStorage.

**Retourne :** `Boolean` - Vrai si données chargées

**Logique :**
1. Tenter de récupérer l'élément par clé
2. Si non trouvé, retourner false
3. Parser chaîne JSON
4. Fusionner dans `params` via `Object.assign()`
5. Valider et corriger valeurs problématiques :
   - `near < 0.01` → `0.01`
   - `cameraDistance < 50` → `600`
   - `cameraOffsetX/Y === undefined` → `0`
6. Retourner true

**Déclencheur :** Appelé une fois au chargement de page.

---

#### `syncUIFromParams()`

Met à jour tous les contrôles UI pour correspondre aux valeurs `params` actuelles.

**But :** Maintenir UI synchronisée quand params chargés depuis fichier ou localStorage.

**Étapes :**

1. **Curseurs :** Pour chaque curseur :
   ```javascript
   slider.value = params[key];
   display.textContent = formatValue(params[key]);
   ```

2. **Cases à cocher :**
   ```javascript
   checkbox.checked = params[key];
   ```

3. **Entrées numériques :**
   ```javascript
   input.value = params[key];
   ```

4. **Menus déroulants :**
   ```javascript
   select.value = params[key];
   ```

5. **Boutons bascule :** Définir classe `active` selon `params[key]`

6. **État caméra :**
   ```javascript
   camera.rotationX = params.cameraRotationX;
   camera.rotationY = params.cameraRotationY;
   camera.distance = max(50, params.cameraDistance);
   camera.offsetX = params.cameraOffsetX || 0;
   camera.offsetY = params.cameraOffsetY || 0;
   ```

7. **Mise à jour canevas :** Appeler `updateCanvasSize()` si nécessaire

---

#### `wireSlider(ZM, sliderId, displayId, paramKey, decimals = 0, label = '')`
(`js/ui/UIController.js`)

Lie un curseur à un paramètre avec persistance automatique.

**Paramètres :**
- `ZM` (Object) : Objet d'état global de l'application
- `sliderId` (String) : ID HTML de l'input range
- `displayId` (String) : ID HTML du span d'affichage de valeur
- `paramKey` (String) : Nom de propriété dans objet `params`
- `decimals` (Number) : Décimales pour affichage
- `label` (String) : Étiquette lisible pour journalisation

**Configuration :**
1. Obtenir éléments DOM
2. Définir valeur curseur depuis params
3. Définir texte d'affichage depuis params
4. Ajouter écouteur d'événement input :
   - Mettre à jour param depuis curseur
   - Mettre à jour texte d'affichage
   - Appeler `saveToLocalStorage()`

**Exemple :**
```javascript
wireSlider(ZM, 'thickness', 'thickness-val', 'lineThickness', 1, 'Thickness');
// Câble curseur d'épaisseur, affiche avec 1 décimale
```

---

### Fonctions d'Export

#### `downloadJSON()`

Exporte les paramètres actuels en tant que fichier JSON.

**Implémentation :**
1. Stringifier params avec indentation : `JSON.stringify(params, null, 2)`
2. Créer Blob avec type `application/json`
3. Créer URL d'objet
4. Créer élément `<a>` temporaire
5. Définir nom de fichier de téléchargement avec horodatage
6. Déclencher clic
7. Révoquer URL d'objet

**Format nom de fichier :** `zigzag-emitter-AAAA-MM-JJTHH-MM-SS.json`

---

#### `loadJSON(file)`

Importe paramètres depuis fichier JSON téléchargé.

**Paramètres :**
- `file` (File) : Objet File JavaScript depuis input

**Implémentation :**
1. Créer FileReader
2. Au chargement :
   - Parser JSON
   - Vérifier si mode stéréoscopique changé
   - Si mode changé, appeler `initializeSketches()`
   - Appeler `syncUIFromParams()`
   - Sauvegarder dans localStorage
3. Lire fichier en tant que texte

**Gestion erreurs :** Try-catch avec alerte en cas d'échec de parsing.

---

#### `exportPNG()`

Capture le canevas actuel en tant qu'image PNG.

**Implémentation :**
1. Obtenir élément canevas de l'instance p5 active
2. Appeler `toDataURL('image/png')`
3. Créer `<a>` temporaire avec URL de données comme href
4. Définir nom de fichier de téléchargement avec horodatage
5. Déclencher clic

**Format nom de fichier :** `zigzag-emitter-AAAA-MM-JJTHH-MM-SS.png`

**Résolution :** Correspond aux dimensions pixel actuelles du canevas.

---

#### `exportSVG()`

Exporte l'image actuelle en tant que fichier SVG vectoriel.

**Algorithme :**

1. **Configuration :**
   - Obtenir dimensions du canevas
   - Calculer distance de génération
   - Créer en-tête SVG

2. **Pour chaque ligne dans l'émetteur :**
   - Construire sommets de ligne centrale
   - Calculer alpha (pour opacité)
   - Construire côtés de ruban via `buildRibbonSides()`
   - Générer chaîne de chemin :
     ```javascript
     M x,y L ... L ... Z  // Move, Lines, Close
     ```
   - Créer élément `<path>` avec :
     - Couleur de remplissage
     - Opacité de remplissage (alpha)
     - Pas de contour

3. **Export :**
   - Fermer balise SVG
   - Créer Blob de type `image/svg+xml`
   - Télécharger via lien temporaire

**Avantages :**
- Indépendant de la résolution
- Éditable dans logiciels vectoriels
- Petite taille de fichier
- Géométrie précise

---

#### `startVideoCapture()`

Commence l'enregistrement vidéo image par image.

**Configuration :**
1. Calculer images totales : `duration × fps`
2. Configurer CCapture :
   ```javascript
   capturer = new CCapture({
     format: params.videoFormat,
     framerate: params.videoFPS,
     verbose: false
   });
   ```
3. Démarrer capture : `capturer.start()`
4. Définir drapeaux d'état d'enregistrement
5. Mettre à jour UI (barre de progression, état bouton)

**Boucle d'enregistrement :**
- Images capturées dans `p.draw()` après rendu
- Pas de temps fixe assure sortie déterministe
- Indicateur de progression se met à jour chaque image

---

#### `stopVideoCapture()`

Termine l'enregistrement et sauvegarde le fichier.

**Implémentation :**
1. Arrêter capturer : `capturer.stop()`
2. Sauvegarder fichier : `capturer.save()`
3. Réinitialiser état d'enregistrement
4. Restaurer UI (masquer progression, réinitialiser bouton)

**Note :** CCapture gère encodage et téléchargement automatiquement.

---

### Initialisation UI

#### Sections Repliables

**Implémentation :**
```javascript
document.querySelectorAll('.section-header').forEach(header => {
  header.addEventListener('click', () => {
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    content.classList.toggle('expanded');
  });
});
```

**Comportement :** Cliquer sur titre de section pour développer/replier contrôles.

---

#### Raccourcis Clavier

**Architecture de raccourcis clavier :**

Tous les raccourcis clavier sont gérés par `js/input/KeyboardHandler.js` avec les mappages définis dans `config/keyboardShortcuts.json`.

**Raccourcis définis dans `config/keyboardShortcuts.json` :**
```json
[
  { "key": "Tab",        "action": "toggleControls",        "description": "Afficher/masquer le panneau" },
  { "key": "Enter",      "action": "toggleFullscreen",      "description": "Plein écran" },
  { "key": "P",          "action": "exportPNG",             "description": "Exporter PNG" },
  { "key": "S",          "action": "exportSVG",             "description": "Exporter SVG" },
  { "key": "D",          "action": "exportDepthMap",        "description": "Exporter carte de profondeur" },
  { "key": "s", "ctrl": true, "action": "downloadJSON",     "description": "Sauvegarder projet JSON" },
  { "key": "R",          "action": "resetCamera",           "description": "Réinitialiser caméra" },
  { "key": "0",          "action": "resetZoom",             "description": "Réinitialiser zoom" },
  { "key": "t",          "action": "toggleRandomThickness", "description": "Épaisseur aléatoire" },
  { "key": "m",          "action": "toggleRandomSpeed",     "description": "Vitesse aléatoire" },
  { "key": "1",          "action": "selectPalette1",        "description": "Palette de couleurs 1" },
  { "key": "2",          "action": "selectPalette2",        "description": "Palette de couleurs 2" },
  { "key": "3",          "action": "selectPalette3",        "description": "Palette de couleurs 3" },
  { "key": "4",          "action": "selectPalette4",        "description": "Palette de couleurs 4" },
  { "key": "y",          "action": "toggleStereoMode",      "description": "Vue stéréoscopique" },
  { "key": " ",          "action": "autoTriggerPlayPause",  "description": "Lecture/Pause états" },
  { "key": "ArrowRight", "action": "autoTriggerSkip",       "description": "État suivant" },
  { "key": "ArrowLeft",  "action": "autoTriggerPrevious",   "description": "État précédent" },
  { "key": "i",          "action": "toggleShortcutsToast",  "description": "Info raccourcis" }
]
```

**Gestionnaire d'Événement :**
```javascript
document.addEventListener('keydown', e => {
  const shortcut = KEYBOARD_SHORTCUTS.find(sc => 
    sc.key === e.key &&
    sc.ctrl === (e.ctrlKey || e.metaKey) &&
    sc.shift === e.shiftKey &&
    sc.alt === e.altKey
  );

  if (shortcut) {
    if (shortcut.preventDefault) e.preventDefault();
    executeAction(shortcut.action);
  }
});
```

**Exemple de Fonctions Action :**
```javascript
function executeAction(actionName) {
  const actions = {
    toggleUIVisibility: () => {
      controls.classList.toggle('hidden');
      body.classList.toggle('ui-hidden');
    },
    toggleFullscreen: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    },
    exportPNG: () => exportPNGButton.click(),
    exportSVG: () => exportSVGButton.click(),
    exportDepthMap: () => exportDepthMapButton.click(),
    toggleVideoRecording: () => {
      if (isRecording) stopVideoCapture();
      else startVideoCapture();
    },
    resetCamera: () => {
      params.camDistance = 500;
      params.camRotationX = 0;
      params.camRotationY = 0;
    }
  };
  
  if (actions[actionName]) actions[actionName]();
}
```

**Bénéfices Architecture :**
- Gestion centralisée (22 raccourcis dans tableau)
- Support touches modificatrices (Ctrl/⌘, Shift, Alt)
- Facilement extensible (ajouter nouvelles entrées)
- Auto-documenté (descriptions intégrées)
- Prévention événement contrôlée par raccourci

---

#### Système de Palettes de Couleurs

**Architecture :**
- **4 palettes** × **4 emplacements de couleur** chacune
- Chaque emplacement a : `rgb` (tableau RGB) et `role` ('line', 'background', ou 'none')
- Les lignes sélectionnent aléatoirement parmi les couleurs avec role='line' au moment de la génération
- L'arrière-plan utilise la première couleur avec role='background', ou noir si aucune

**Changement de palette :**
```javascript
// Déclenché par les raccourcis clavier (1-2-3-4) ou les boutons UI
function triggerPaletteChange(newIndex) {
  params.activePaletteIndex = newIndex;
  
  // Déclencher transitions de couleur dans toutes les lignes existantes
  emitterInstance.lines.forEach(line => {
    const colorData = pickRandomLineColor();
    line.transitionToColor(colorData.color);
  });
  
  // Déclencher transition d'arrière-plan
  SketchFactory.backgroundTransition.start = SketchFactory.backgroundTransition.current;
  SketchFactory.backgroundTransition.target = getBackgroundColor();
  SketchFactory.backgroundTransition.progress = 0;
  SketchFactory.backgroundTransition.isTransitioning = true;
  
  syncUIFromParams();
  saveToLocalStorage();
}
```

**Transition de couleur dans ZigzagLine :**
```javascript
transitionToColor(newColor) {
  this.startColor = [...this.currentColor];
  this.targetColor = newColor;
  this.colorTransitionProgress = 0;
  this.isTransitioning = true;
}

update(dt) {
  // ... mises à jour de position
  
  // Interpolation de couleur pendant transition (mise en cache pour éviter recalcul 60fps)
  if (this.isTransitioning) {
    this.colorTransitionProgress += dt / params.colorTransitionDuration;
    
    if (this.colorTransitionProgress >= 1) {
      this.currentColor = [...this.targetColor];
      this.isTransitioning = false;
    } else {
      this.currentColor = lerpColor(
        this.startColor,
        this.targetColor,
        this.colorTransitionProgress
      );
    }
  }
}
```

**Z-offset pour séparation de profondeur :**
Chaque emplacement de couleur obtient un décalage d'axe Z distinct pour empêcher z-fighting WebGL :
```javascript
// Dans le constructeur ZigzagLine
this.zOffset = (colorSlotIndex - 2) * params.colorSlotZOffset;
// colorSlotIndex: 0 → zOffset: -200 (au multiplicateur par défaut 100)
// colorSlotIndex: 1 → zOffset: -100
// colorSlotIndex: 2 → zOffset: 0
// colorSlotIndex: 3 → zOffset: +100
```

**Stockage :**
Toutes les données de palette persistent dans localStorage et les exports JSON avec compatibilité ascendante pour les anciennes sauvegardes.

**Déclencheur :** Bouton de palette/clavier → toutes les lignes transitionnent en douceur sur 3 secondes.

---

#### Curseurs à Double Plage

Utilisés pour découpe Proche/Lointain et plages épaisseur/vitesse.

**Logique de contrainte :**
```javascript
nearSlider.addEventListener('input', () => {
  if (nearSlider.value >= farSlider.value) {
    nearSlider.value = farSlider.value - 1;
  }
  // Mettre à jour params & affichage
});

farSlider.addEventListener('input', () => {
  if (farSlider.value <= nearSlider.value) {
    farSlider.value = nearSlider.value + 1;
  }
  // Mettre à jour params & affichage
});
```

**But :** Empêcher plages invalides (min ≥ max).

---

#### FOV avec Compensation de Distance

**Implémentation :**
```javascript
fovSlider.addEventListener('input', () => {
  const oldFOV = params.fov;
  const newFOV = parseFloat(fovSlider.value);
  
  // Calculer ratio de compensation
  const oldFOVRad = oldFOV * Math.PI / 180;
  const newFOVRad = newFOV * Math.PI / 180;
  const ratio = Math.tan(oldFOVRad / 2) / Math.tan(newFOVRad / 2);
  
  // Appliquer à distance
  const oldDistance = camera.distance;
  const newDistance = clamp(oldDistance * ratio, 50, 10000);
  
  // Mettre à jour état
  params.fov = newFOV;
  camera.distance = newDistance;
  params.cameraDistance = newDistance;
  
  // Logger pour débogage
  console.log(`FOV: ${oldFOV}° → ${newFOV}°, Distance: ${oldDistance} → ${newDistance}`);
  
  saveToLocalStorage();
});
```

**Théorie :**
Pour taille apparente constante :
```
newDistance = oldDistance × tan(oldFOV/2) / tan(newFOV/2)
```

**Effet :**
- FOV plus large → caméra plus proche (maintient taille)
- FOV plus étroit → caméra plus éloignée (maintient taille)
- Seule la distorsion de perspective change

---

## Pipeline de Rendu

### Séquence de Rendu d'Image

```
┌─────────────────────────────────────┐
│  1. p.background(0)                 │
│     Effacer canevas en noir         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. Mettre à jour caméra depuis     │
│     souris                          │
│     - Rotation (glissement gauche)  │
│     - Déplacement (glissement droit)│
│     - Zoom (molette)                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. Définir matrice de projection   │
│     p.perspective(fov, aspect, ...) │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. Calculer temps delta            │
│     dt = (now - lastTime) / 1000    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. Push matrice (sauvegarder état) │
│     p.push()                        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  6. Appliquer transformations       │
│     caméra                          │
│     - Décalage stéréo (si activé)   │
│     - Décalage de déplacement       │
│     - Zoom (translate Z)            │
│     - Rotation d'orbite (X, Y)      │
│     - Rotation plan Z               │
│     - Échelle géométrique           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  7. Mettre à jour simulation        │
│     (primaire)                      │
│     - noiseOffset += dt × 4         │
│     - emitter.update(dt)            │
│       - Générer nouvelles lignes    │
│       - Mettre à jour positions     │
│       - Éliminer lignes mortes      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  8. Dessiner toutes les lignes      │
│     emitter.draw(p)                 │
│     - Pour chaque ligne :           │
│       - Calculer alpha              │
│       - Construire géométrie ruban  │
│       - Dessiner forme remplie      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  9. Pop matrice (restaurer état)    │
│     p.pop()                         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  10. Capturer image (si             │
│      enregistrement)                │
│      capturer.capture(canvas)       │
└─────────────────────────────────────┘
```

---

## Système de Caméra

### Hiérarchie de Transformation

Les transformations sont appliquées dans cet ordre (de l'intérieur vers l'extérieur) :

```
1. Espace local géométrie (sommets zigzag)
2. Position ligne (translate par line.x, line.y)
3. Échelle géométrique (params.geometryScale)
4. Rotation plan Z (params.emitterRotation)
5. Orbite caméra (rotateY, rotateX)
6. Zoom caméra (translate Z par -distance)
7. Déplacement caméra (translate XY par décalages)
8. Décalage œil stéréo (translate X par ±eyeSeparation/2)
9. Projection (perspective avec FOV)
```

### Exemple de Transformation de Coordonnées

Point au sommet zigzag `(vx, vy, 0)` :

```javascript
// 1. Position ligne
worldX = vx + (line.x - W/2)
worldY = vy + (line.y - H/2)
worldZ = 0

// 2. Échelle
worldX *= scale / 100
worldY *= scale / 100

// 3. Rotation Z
θ = emitterRotation × π/180
x' = worldX × cos(θ) - worldY × sin(θ)
y' = worldX × sin(θ) + worldY × cos(θ)

// 4. Rotation d'orbite
// Appliquer matrices rotateX puis rotateY

// 5. Zoom + Déplacement
x'' = x' + offsetX
y'' = y' + offsetY
z'' = z' - distance

// 6. Décalage stéréo (si applicable)
x''' = x'' + cameraOffset

// 7. Projection
// Division perspective par profondeur
```

### Mapping Souris vers Caméra

**Rotation (glissement gauche) :**
```javascript
const sensitivity = 0.005;  // radians par pixel
rotationY += dx * sensitivity;
rotationX += dy * sensitivity;
rotationX = clamp(rotationX, -π/2, π/2);  // Limiter tangage
```

**Déplacement (glissement droit) :**
```javascript
const sensitivity = max(0.5, distance / 500);
offsetX += dx * sensitivity;
offsetY += dy * sensitivity;
```

**La sensibilité évolue avec la distance** - caméra plus éloignée = déplacement plus rapide.

**Zoom (défilement) :**
```javascript
const zoomSpeed = 20;  // pixels par cran de défilement
distance += event.delta * zoomSpeed;
distance = clamp(distance, 50, 10000);
```

---

## Système d'Incrustation

**NOUVEAU DANS v26 :** Système d'image statique en incrustation composée par-dessus le canevas pour le branding, les filigranes ou les éléments de design.

### Architecture

Le système d'incrustation utilise des éléments d'image HTML positionnés de manière absolue au-dessus du canevas, puis composités dans les exports PNG/vidéo.

**Structure HTML (index.html) :**
```html
<img id="overlay-image" alt="Overlay" style="position: absolute; z-index: 1000; pointer-events: none; display: none;">
```

**Attributs Clés :**
- `position: absolute`: Positionné au-dessus du canevas dans l'espace 2D
- `z-index: 1000`: Toujours sur la couche supérieure
- `pointer-events: none`: Ne bloque pas l'interaction souris avec le canevas
- `display: none`: Caché par défaut

### Stockage des Paramètres

Les paramètres d'incrustation sont **globaux au projet** (non sauvegardés par état) :

```javascript
// js/config/defaults.js
overlayImageSrc: null,        // URL/URI de données de l'image
overlayVisible: false,        // Basculer la visibilité
overlayScale: 100,           // Taille (10-200%)
overlayOpacity: 100,         // Transparence (0-100%)
overlayX: 50,                // Position horizontale (0-100%)
overlayY: 50,                // Position verticale (0-100%)
```

### Système de Préréglages **NOUVEAU**

**Vue d'Ensemble de l'Architecture :**

Le système de préréglages permet le chargement instantané d'images d'incrustation préconfigurées depuis le dossier `assets/overlays/`, éliminant le besoin pour les utilisateurs de charger manuellement des logos ou filigranes communs.

**Structure de Répertoire :**
```
assets/overlays/
├── area-zero-white.json
├── mapping_white.json
├── ddest_white.json
├── ddest-no-box-white.json
├── promo-logo.json
└── zigmap-white.json
```

**Format de Fichier JSON :**
```json
{
  "id": "logo1",
  "filename": "logo1.png",
  "type": "image/png",
  "data": "data:image/png;base64,iVBORw0KG..."
}
```

**Descriptions des Champs :**
- `id`: Identifiant unique (nom de fichier sans extension)
- `filename`: Nom de fichier image original
- `type`: Type MIME (image/png, image/jpeg, image/svg+xml)
- `data`: URI de données encodée en Base64

**Implémentation du Chargement (js/ui/UIController.js) :**

```javascript
async function loadOverlayPresets(ZM) {
  const overlayFiles = [
    'area-zero-white.json',
    'mapping_white.json',
    'ddest_white.json',
    'ddest-no-box-white.json',
    'promo-logo.json',
    'zigmap-white.json'
  ];
  
  ZM.overlayPresets = [];
  
  for (const filename of overlayFiles) {
    try {
      const response = await fetch(`assets/overlays/${filename}`);
      if (!response.ok) {
        console.warn(`Préréglage d'incrustation introuvable : ${filename}`);
        continue;
      }
      const preset = await response.json();
      ZM.overlayPresets.push(preset);
    } catch (err) {
      console.warn(`Échec du chargement du préréglage : ${filename}`, err);
    }
  }
  
  console.log(`${ZM.overlayPresets.length} préréglages d'incrustation chargés`);
}
```

**Intégration UI :**

```javascript
function setupOverlayControls(ZM) {
  await loadOverlayPresets(ZM);  // Charger les préréglages d'abord
  
  const presetSelect = document.getElementById('overlay-preset');
  const loadCustomBtn = document.getElementById('load-overlay-btn');
  
  // Peupler le menu déroulant avec les préréglages
  ZM.overlayPresets.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.filename.replace('.json', '').replace(/_/g, ' ');
    presetSelect.appendChild(option);
  });
  
  // Ajouter l'option "Image personnalisée" à la fin
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = '-- Image personnalisée --';
  presetSelect.appendChild(customOption);
  
  // Gérer la sélection de préréglage
  presetSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      // Déclencher le sélecteur de fichier personnalisé
      loadCustomBtn.click();
      return;
    }
    
    // Charger le préréglage depuis les données Base64
    const preset = ZM.overlayPresets.find(p => p.id === e.target.value);
    if (preset) {
      const overlayImg = document.getElementById('overlay-image');
      overlayImg.src = preset.data;
      ZM.params.overlayImageSrc = preset.data;
      ZM.params.overlayVisible = true;
      document.getElementById('show-overlay').checked = true;
      updateOverlayVisibility(ZM);
      saveParams(ZM);
    }
  });
}
```

**Outil Utilitaire de Conversion :**

Emplacement : `utilities/overlay-converter.html`

Un outil HTML autonome pour convertir des images au format JSON Base64 de préréglage :

**Fonctionnalités :**
- Interface glisser-déposer HTML5 native (aucune dépendance externe)
- Support de conversion par lots
- Prévisualisation instantanée des images sélectionnées
- Génération automatique de fichiers JSON
- Formats supportés : SVG, PNG, JPG, GIF

**Logique de Conversion Principale :**
```javascript
async function convertToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = {
        id: file.name.replace(/\.[^.]+$/, ''),  // Enlever l'extension
        filename: file.name,
        type: file.type || 'image/png',
        data: e.target.result  // URI de données Base64
      };
      resolve(json);
    };
    reader.readAsDataURL(file);
  });
}

function downloadJSON(jsonObj, filename) {
  const blob = new Blob(
    [JSON.stringify(jsonObj, null, 2)], 
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Flux de Travail d'Utilisation :**
1. Ouvrir `utilities/overlay-converter.html` dans le navigateur
2. Glisser-déposer des fichiers images ou cliquer pour parcourir
3. Prévisualiser les images sélectionnées dans l'interface
4. Cliquer sur le bouton "Convertir Tout en Base64"
5. Chaque image se télécharge comme fichier JSON séparé
6. Déplacer les fichiers JSON vers le dossier `assets/overlays/`
7. Ajouter les noms de fichiers au tableau `overlayFiles` dans UIController.js
8. Recharger l'application - les nouveaux préréglages apparaissent dans le menu déroulant

**Avantages Techniques :**
- **Aucun serveur requis**: Base64 embarqué directement dans JSON
- **Chargement rapide**: Tous les préréglages chargeables en parallèle au démarrage
- **Compatible avec le contrôle de version**: Fichiers JSON suivis dans git
- **Multi-plateforme**: Fonctionne identiquement sur tous les systèmes d'exploitation
- **Capacité hors ligne**: Aucune dépendance d'hébergement d'image externe
- **Sécurité de type**: Type MIME préservé dans JSON pour validation

**Considérations de Performance :**
- L'encodage Base64 augmente la taille de fichier de ~33%
- Logo moyen (PNG 50Ko) → JSON ~67Ko
- 6 préréglages (~400Ko total) se chargent en <100ms sur connexion typique
- Images mises en cache dans la mémoire du navigateur après premier chargement
- Aucun impact sur les performances d'exécution (chargé une fois au démarrage)

### Synchronisation de l'Affichage

**Mise à Jour Position & Échelle :**
```javascript
function updateOverlayPosition(ZM) {
  const overlayImg = document.getElementById('overlay-image');
  const { params } = ZM;
  
  // Calculer la position CSS
  overlayImg.style.left = `${params.overlayX}%`;
  overlayImg.style.top = `${params.overlayY}%`;
  overlayImg.style.transform = `translate(-50%, -50%) scale(${params.overlayScale / 100})`;
  overlayImg.style.opacity = params.overlayOpacity / 100;
}
```

**Chaîne de Transformation CSS :**
1. `translate(-50%, -50%)`: Centre l'incrustation sur le point de position
2. `scale(${overlayScale / 100})`: Applique la mise à l'échelle de taille
3. `left/top`: Positionne le point central (0-100% du canevas)
4. `opacity`: Transparence (0-1)

### Compositing d'Export

Voir la section **Système d'Export** ci-dessous pour les détails sur :
- Correction de densité de pixels
- Positionnement d'incrustation dans les exports
- Compositing vidéo image par image

### Contrôles UI

**Panneau de Contrôle d'Incrustation :**
- **Afficher l'Incrustation**: ☑️ Case à cocher pour basculer la visibilité
- **Menu Déroulant de Préréglages**: Sélection rapide de logos préconfigurés
- **Charger Image Personnalisée**: Bouton pour importer PNG/JPG/SVG propre
- **Échelle** (10-200%): Redimensionner l'incrustation
- **Opacité** (0-100%): Transparence
- **Position X/Y** (0-100%): Placer l'incrustation n'importe où
- **Effacer Image**: Supprimer l'incrustation et réinitialiser

### Flux de Travail

**Utilisation Typique :**
1. Sélectionner un préréglage depuis le menu déroulant (ou charger image personnalisée)
2. Ajuster l'échelle et la position
3. Définir l'opacité (ex., 50% pour filigrane subtil)
4. Créer plusieurs états avec différentes animations
5. Exporter PNG/vidéo - l'incrustation est incluse automatiquement

**Meilleures Pratiques :**
- Utiliser PNG avec transparence pour les logos
- Définir opacité 30-50% pour filigranes subtils
- Positionner dans les coins (X/Y: 10% ou 90%) pour le branding
- Centrer (X/Y: 50%) pour éléments de design principaux
- Réduire l'échelle (50-80%) pour incrustations non intrusives

---

## Système d'Export

### Comparaison d'Export

| Fonctionnalité | PNG | SVG | Carte Profondeur | Vidéo |
|----------------|-----|-----|------------------|-------|
| **Type** | Raster | Vectoriel | Raster (niveaux gris) | Flux vidéo |
| **Résolution** | Fixe (pixels canevas) | Infinie | Fixe (pixels canevas) | Fixe (pixels canevas) |
| **Éditabilité** | Non | Oui (chemins) | Non | Non |
| **Taille Fichier** | ~100Ko - 2Mo | ~10Ko - 500Ko | ~100Ko - 2Mo | ~5Mo - 100Mo+ |
| **Animation** | Image unique | Image unique | Image unique | Animation complète |
| **Qualité** | Avec perte (après redimensionnement) | Sans perte | Sans perte | Compressée |
| **Meilleur Usage** | Partage rapide | Travail design | Compositing/Post-prod | Présentation |
| **Cas d'Usage** | Aperçus, réseaux sociaux | Impressions, édition | Effets de profondeur, Z-buffer | Démos animées |

### Détails Techniques Export Vidéo

**Intégration CCapture.js :**

1. **Pas de Temps Fixe :**
   ```javascript
   if (isRecording) {
     dt = 1 / params.videoFPS;  // ex., 1/30 = 0.0333...
   }
   ```
   - Assure vitesse d'animation cohérente
   - Indépendant du temps de rendu réel
   - Garantit sortie déterministe

2. **Capture d'Image :**
   ```javascript
   if (isRecording) {
     capturer.capture(p5Instance.canvas);
     recordingFrameCount++;
     updateProgressBar();
     
     if (recordingFrameCount >= recordingTotalFrames) {
       stopVideoCapture();
     }
   }
   ```

3. **Encodage :**
   - Dépendant du navigateur (codec WebM varie)
   - CCapture gère encodage du flux
   - Fichier téléchargé une fois terminé

**Limitations :**
- Pas d'interaction pendant enregistrement
- Résolution élevée + longue durée = processus lent
- Taille fichier croît linéairement avec images

**Support des Formats Vidéo :**

⚠️ **Important :** L'export MP4 n'est **pas pris en charge** dans les navigateurs web en raison de restrictions de licence de codec.

- **WebM** : ✅ Entièrement pris en charge dans tous les navigateurs modernes (Chrome, Firefox, Edge, Safari)
- **GIF** : ✅ Pris en charge mais tailles de fichier plus grandes et palette de couleurs limitée
- **MP4** : ❌ Non pris en charge - automatiquement converti en WebM

**Explication Technique :**

Le codec H.264/MP4 nécessite des frais de licence et n'est pas librement disponible dans les bibliothèques JavaScript basées sur navigateur. CCapture.js (la bibliothèque d'enregistrement sous-jacente) ne prend en charge que les formats WebM (VP8/VP9) et GIF.

Si vous sélectionnez "mp4" comme format vidéo, l'application le convertit automatiquement en "webm" en arrière-plan :

```javascript
// Implémentation VideoRecorder.js
format: ZM.params.videoFormat === 'mp4' ? 'webm' : ZM.params.videoFormat
```

**Solution de Contournement pour MP4 :**

1. Exporter en WebM depuis SpaceFlow
2. Convertir avec **Shutter Encoder** (recommandé) :
   - **Meilleur convertisseur** : Outil gratuit, open-source et professionnel
   - **Télécharger** : https://github.com/paulpacifico/shutter-encoder
   - **Fonctionnalités** : Accélération GPU, conversion par lot, support étendu des codecs
   - **Utilisation** : Glisser fichier WebM → Sélectionner MP4 H.264 → Convertir
3. Outils alternatifs :
   - **ffmpeg** (ligne de commande) : `ffmpeg -i entree.webm sortie.mp4`
   - **HandBrake** (interface graphique) : https://handbrake.fr/
   - **En ligne** : CloudConvert, FreeConvert

**Pourquoi WebM est Excellent :**
- Open source et sans redevance
- Excellente compression (comparable à MP4)
- Support natif du navigateur (aucun plugin nécessaire)
- Prend en charge la haute résolution et la transparence
- Largement accepté sur les plateformes modernes (YouTube, Twitter, Discord)

---

### Détails Techniques Export Carte de Profondeur

**Architecture :**

**Architecture :**
1. Capture position polygones 3D actuels (coordonnées monde)
2. Projette tous les sommets via matrice caméra exacte (comme export SVG)
3. Scanne profondeurs min/max à travers scène complète
4. Normalise valeurs profondeur vers plage 0-255 avec courbe puissance gamma
5. Rastérise triangles projetés dans buffer greyscale PNG

**Flux d'Implémentation :**
```javascript
function exportDepthMap() {
  // 1. CONFIGURATION DU CANEVAS
  const buffer = createGraphics(width, height);
  buffer.pixelDensity(1);
  buffer.background(0);  // Noir = loin
  
  // 2. EXTRACTION DE POLYGONES
  const polys = activeElements.map(el => ({
    vertices: el.getVertices(),  // [x, y, z, x, y, z, ...]
    color: el.getColor()
  }));
  
  // 3. SCAN DE PLAGE DE PROFONDEUR
  const [zMin, zMax] = scanDepthRange(polys);
  
  // 4. RASTÉRISATION
  polys.forEach(poly => {
    rasteriseDepthPolygon(poly.vertices, zMin, zMax, buffer);
  });
  
  // 5. TÉLÉCHARGEMENT
  buffer.save('depth_map.png');
}
```

**Algorithme d'Auto-Ajustement :**
```javascript
function scanDepthRange(polygons) {
  let zMin = Infinity;
  let zMax = -Infinity;
  
  polygons.forEach(poly => {
    for (let i = 0; i < poly.vertices.length; i += 3) {
      const [x, y, z] = [poly.vertices[i], poly.vertices[i+1], poly.vertices[i+2]];
      
      // Projeter via matrice caméra complète
      const projected = projectVertex(x, y, z, camMatrix);
      const depth = projected.z;  // Profondeur après transformation
      
      zMin = min(zMin, depth);
      zMax = max(zMax, depth);
    }
  });
  
  return [zMin, zMax];
}
```

**Pourquoi scanner d'abord ?**
- Utilise plage complète 0-255 (maximise résolution profondeur)
- Évite découpage (zNear/zFar fixes causeraient pertes)
- Adapte automatiquement à composition scène variée

**Encodage Profondeur :**
```javascript
function rasteriseDepthPolygon(vertices, zMin, zMax, buffer) {
  buffer.loadPixels();
  
  // Projeter tous sommets
  const projected = [];
  for (let i = 0; i < vertices.length; i += 3) {
    const [x, y, z] = [vertices[i], vertices[i+1], vertices[i+2]];
    const p = projectVertex(x, y, z, camMatrix);
    projected.push(p);
  }
  
  // Logique scanline pour remplissage triangle
  // (Simplifié - version réelle utilise interpolation barycentrique)
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      if (pointInTriangle(px, py, projected)) {
        // Interpoler profondeur à travers triangle
        const depth = interpolateDepth(px, py, projected);
        
        // Normaliser vers 0-1, puis inverser et appliquer gamma
        let normalized = (depth - zMin) / (zMax - zMin);
        normalized = 1.0 - normalized;  // Inverser (proche=blanc)
        normalized = pow(normalized, 0.6);  // Correction gamma
        
        const brightness = floor(normalized * 255);
        const idx = (py * width + px) * 4;
        buffer.pixels[idx] = brightness;      // R
        buffer.pixels[idx+1] = brightness;    // G
        buffer.pixels[idx+2] = brightness;    // B
        buffer.pixels[idx+3] = 255;           // A
      }
    }
  }
  
  buffer.updatePixels();
}
```

**Caractéristiques Clés :**
- **Alignement avec SVG** : Utilise transformation caméra identique (cohérence géométrique)
- **Auto-Ajustement** : Scanne zMin/zMax pour utiliser gamme complète greyscale
- **Courbe Puissance** : Gamma 0.6 génère meilleure distribution tonale visuelle
- **Inversion** : Proche=blanc, loin=noir (convention de passe profondeur standard)
- **Basé-CPU** : Calcul JavaScript pur (aucune dépendance shader GPU)
- **Format PNG** : Compatible avec logiciels compositing (After Effects, Nuke, Blender)

**Cas d'Usage :**
- Flou de profondeur de champ en post-production
- Effets de brouillard/atmosphère
- Sélection/masquage basé profondeur
- Intégration 3D (Z-buffer pour compositing)
- Visualisation de profondeur (debug disposition spatiale)

---

## Considérations de Performance

### Stratégies d'Optimisation

1. **Densité de Pixels :**
   ```javascript
   p.pixelDensity(1);  // Forcer ratio 1:1
   ```
   - Empêche mise à l'échelle haute DPI (écrans Retina)
   - Réduit nombre de pixels jusqu'à 4× sur écrans 2×

2. **Taux d'Émission :**
   - Chaque ligne = ~34 sommets (16 segments × 2 côtés + capuchons)
   - 10 lignes/sec @ 60fps = 600 lignes actives (supposant durée vie 60s)
   - ~20 400 sommets par image
   - Taux d'émission plus bas = moins de lignes actives

3. **Élimination Canevas :**
   - Lignes hors limites de génération sont supprimées
   - Réduit appels de dessin et mémoire

4. **Émetteur Partagé :**
   - Mode stéréo partage instance Emitter unique
   - Simulation s'exécute une fois, rendue deux fois
   - Divise coût CPU des mises à jour par deux

5. **Limitation LocalStorage :**
   - Pourrait débouncer `saveToLocalStorage()` pour contrôles haute fréquence
   - Actuellement sauvegarde à chaque changement (acceptable pour la plupart des paramètres)

### Métriques de Performance

Performance typique sur matériel moderne :

| Scénario | FPS | Lignes Actives |
|----------|-----|----------------|
| Défaut (taux 1.5/s) | 60 | ~90 |
| Élevé (taux 5/s) | 55-60 | ~300 |
| Extrême (taux 10/s) | 45-55 | ~600 |
| Stéréo (défaut) | 50-55 | ~90 (par œil) |

**Goulots d'Étranglement :**
- Traitement de sommets (WebGL)
- Dessin de formes (p5.js)
- Calcul géométrie ruban

---

## Guide d'Extension

### Ajouter Nouveaux Contrôles

**1. Ajouter HTML :**
```html
<div class="control-group">
  <label>Nouveau Paramètre</label>
  <div class="slider-row">
    <input type="range" id="new-param" min="0" max="100" value="50"/>
    <span class="value-display" id="new-param-val">50</span>
  </div>
</div>
```

**2. Ajouter à `params` :**
```javascript
const params = {
  // ... params existants
  newParameter: 50
};
```

**3. Câbler contrôle :**
```javascript
wireSlider(ZM, 'new-param', 'new-param-val', 'newParameter');
```

**4. Utiliser dans code :**
```javascript
// N'importe où params est accédé
const value = params.newParameter;
```

**5. Ajouter à `syncUIFromParams` :**
```javascript
{ id: 'new-param', key: 'newParameter' }
```

---

### Ajouter Formes Personnalisées

**1. Créer nouvelle classe :**
```javascript
class CustomShape {
  constructor({ p, x, y, ...customParams }) {
    this.p = p;
    this.x = x;
    this.y = y;
    // Stocker paramètres personnalisés
    this.alive = true;
  }
  
  update(dt) {
    // Mettre à jour position, vérifier limites
    // Définir this.alive = false quand terminé
  }
  
  draw(p) {
    // Logique de rendu
    p.push();
    p.translate(this.x - W/2, this.y - H/2, 0);
    // Dessiner votre forme
    p.pop();
  }
}
```

**2. Modifier émetteur :**
```javascript
_emit() {
  // Optionnellement alterner ou choisir selon params
  if (params.shapeType === 'custom') {
    this.lines.push(new CustomShape({
      p: this.p,
      x: this.x,
      y: this.y,
      // Paramètres personnalisés
    }));
  } else {
    // ZigzagLine existante
  }
}
```

---

### Ajouter Formats d'Export

**Exemple : export JPEG**

```javascript
function exportJPEG() {
  const canvas = p5Instance.canvas;
  const dataURL = canvas.toDataURL('image/jpeg', 0.9);  // Qualité 90%
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `zigzag-emitter-${formatTimestamp()}.jpg`;
  a.click();
}
```

Câbler au bouton dans HTML.

---

### Palettes de Couleurs Personnalisées

**Personnalisation des palettes existantes :**
1. Sélectionnez la palette (1-4) via les boutons ou le clavier
2. Cliquez sur les sélecteurs de couleur pour ajuster les valeurs RGB
3. Définissez les rôles de couleur via les menus déroulants (Line/Background/None)
4. Ajustez le curseur **Color Depth Separation** (10-500) pour contrôler le multiplicateur de Z-offset

**Ajout de plus de palettes :**
Éditez `js/config/defaults.js` :
```javascript
palettes: [
  // Ajouter 5ème palette
  [
    { rgb: [255, 128, 0], role: 'line' },
    { rgb: [0, 255, 128], role: 'line' },
    { rgb: [128, 0, 255], role: 'background' },
    { rgb: [255, 255, 0], role: 'none' }
  ]
],
```

Mettez à jour `js/ui/UIController.js` pour ajouter un 5ème bouton au sélecteur de palette.

**Notes techniques :**
- Les transitions de couleur utilisent l'interpolation linéaire RGB (lerpColor)
- Formule de Z-offset : `(slotIndex - 2) × multiplier` centre à 0
- Les drapeaux isTransitioning empêchent les calculs inutiles après la fin des transitions

---

## Débogage

### Journalisation Console

L'application inclut des logs console stratégiques :

**Chargement page :**
```
Chargé depuis localStorage, camera.distance = 600
Configuration terminée - camera.distance: 600 isPrimary: true
```

**Événements souris :**
```
mousePressed - button: RIGHT, LEFT: LEFT, RIGHT: RIGHT
→ Bouton Droit/Central: mode déplacement
→ état caméra: {isDragging: false, isPanning: true}
```

**Déplacement :**
```
camera.distance avant calcul: 600 params.cameraDistance: 600
PANNING: {dx: 5, dy: -3, sens: 1.2, distance: 600, offsetX: 6, offsetY: -3.6}
```

**Changements FOV :**
```
FOV changé: 60.00° → 90.00°, Distance: 600.0 → 346.4 (ratio: 0.577)
```

**Zoom :**
```
mouseWheel: camera.distance = 720
```

---

### Problèmes Courants

**Lignes n'apparaissent pas :**
- Vérifier `emitRate` > 0
- Vérifier distance caméra pas trop éloignée/proche
- Vérifier plans de découpe (proche/lointain)
- Assurer dimensions canevas valides

**Déplacement ne fonctionne pas :**
- Vérifier console pour `camera.distance` - devrait être ≥ 50
- Vérifier menu contextuel clic droit empêché
- Vérifier état `camera.isPanning` dans logs

**Problèmes de performance :**
- Réduire `emitRate`
- Désactiver modulations aléatoires
- Baisser résolution canevas
- Vérifier accélération matérielle navigateur

**Échecs d'export :**
- PNG/SVG : Vérifier autorisations téléchargement navigateur
- Vidéo : Assurer page visible pendant enregistrement
- Vérifier console navigateur pour erreurs

---

### Outils Dev Navigateur

**Inspections utiles :**

1. **Console :** Instructions `console.log()` pour état
2. **Réseau :** Vérifier chargements bibliothèques (p5.js, CCapture.js)
3. **Performance :** Profiler timing d'images
4. **Application → Local Storage :** Voir `zigmap26Settings`
5. **Éléments :** Inspecter dimensions et classes canevas

**Commandes Console :**

Pour une liste complète des commandes de débogage et des fonctions API globales, voir **[Référence des Commandes Console](Console-Commands-fr.md)**.

---

## Idées d'Amélioration Future

Fonctionnalités potentielles pour versions futures :

- **Physique :**
  - Gravité
  - Champs de force de vent
  - Détection de collision entre lignes

- **Motifs Avancés :**
  - Chemins courbes (Bézier/Catmull-Rom)
  - Motifs spirale/circulaires
  - Zigzag 3D (variation profondeur)

- **Effets Visuels :**
  - Shader lueur/bloom
  - Flou de profondeur de champ
  - Traînées de flou de mouvement
  - Systèmes de particules aux sommets

- **Améliorations UI :**
  - Bibliothèque de préréglages (sauvegarder configurations multiples)
  - Timeline/images-clés d'animation
  - Support contrôleur MIDI
  - Système annuler/refaire

- **Export :**
  - Export GIF
  - WebM avec transparence
  - Export modèle 3D OBJ/GLB
  - Génération script After Effects

- **Performance :**
  - Rendu d'instance (instancing WebGL)
  - Web Workers pour physique
  - Shaders de calcul GPU

---

## Références

- **Documentation p5.js :** https://p5js.org/reference/
- **GitHub CCapture.js :** https://github.com/spite/ccapture.js/
- **Fondamentaux WebGL :** https://webglfundamentals.org/
- **Bruit de Perlin :** https://fr.wikipedia.org/wiki/Bruit_de_Perlin
- **Joints en Onglet :** https://fr.wikipedia.org/wiki/Assemblage_%C3%A0_onglet

---

## Licence

[Spécifiez votre licence ici]

---

**Version :** 10.0  
**Dernière Mise à Jour :** 7 mars 2026  
**Auteur :** [Votre nom/équipe]  
**Projet :** TheSpaceLab / Mapping 2026

---

Pour questions ou contributions, veuillez contacter [vos informations de contact].


---

# SpaceFlow — Architecture Modulaire

## Vue d'Ensemble

ZigMap26 est une modularisation complète de l'application ZigzagEmitter originale. Le fichier HTML monolithique a été transformé en une architecture moderne basée sur les modules ES6 avec une séparation appropriée des préoccupations.

## Structure du Projet

```
SpaceFlow/
├── index.html                    # Point d'entrée HTML principal
├── css/                          # Feuilles de style
│   ├── main.css                  # Styles de base et mise en page
│   ├── canvas.css                # Styles de rendu du canevas
│   └── controls.css              # Styles du panneau de contrôle UI
├── js/
│   ├── main.js                   # Orchestrateur de l'application
│   ├── config/                   # Modules de configuration
│   │   ├── defaults.js           # Export DEFAULT_PARAMS
│   │   └── constants.js          # Constantes de l'application
│   ├── core/                     # Classes de rendu principales
│   │   ├── ZigzagLine.js         # Objet ruban zigzag unique
│   │   ├── Emitter.js            # Émission et cycle de vie des lignes
│   │   ├── Camera.js             # Gestion de l'état de la caméra
│   │   ├── utils.js              # Fonctions utilitaires partagées
│   │   └── Projection.js         # Mathématiques de projection 3D vers 2D
│   ├── storage/                  # Persistance
│   │   └── localStorage.js       # Sauvegarde/chargement des paramètres
│   ├── rendering/                # Intégration p5.js
│   │   └── SketchFactory.js      # Création du sketch p5
│   ├── export/                   # Fonctionnalité d'export
│   │   ├── SVGExporter.js        # Export graphique vectoriel
│   │   ├── PNGExporter.js        # Export image raster
│   │   ├── DepthExporter.js      # Export carte de profondeur
│   │   └── VideoRecorder.js      # Intégration CCapture.js
│   ├── ui/                       # Interface utilisateur
│   │   └── UIController.js       # Liaison des contrôles
│   └── input/                    # Gestion des entrées
│       ├── KeyboardHandler.js    # Raccourcis clavier
│       └── MouseHandler.js       # Contrôles souris de la caméra
├── config/                       # Configurations JSON
│   ├── keyboardShortcuts.json    # Raccourcis centralisés
│   ├── uiPresets.json            # Préréglages framebuffer/couleur
│   └── appInfo.json              # Métadonnées de l'application
├── docs/                         # Documentation
│   ├── English/                  # Documentation anglaise
│   │   ├── README.md             # Guide utilisateur (EN)
│   │   ├── User-Manual.md        # Manuel utilisateur (EN)
│   │   ├── Documentation.md      # Docs techniques (EN)
│   │   └── Projection-Matrix-Guide.md  # Guide mathématique (EN)
│   ├── French/                   # Documentation française
│   │   ├── README-fr.md          # Guide utilisateur (FR)
│   │   ├── User-Manual-fr.md     # Manuel utilisateur (FR)
│   │   ├── Documentation-fr.md   # Docs techniques (FR)
│   │   └── Projection-Matrix-Guide-fr.md  # Guide mathématique (FR)
│   └── markdown-viewer.html      # Visionneuse de documentation
```

## Principes d'Architecture

### 1. **Séparation des Préoccupations**
- **Modules CSS** : Style séparé en fichiers thématiques (main, canvas, controls)
- **Modules JavaScript** : Code organisé par fonction (core, rendering, export, UI, input)
- **Configs JSON** : Configuration externe pour raccourcis clavier, préréglages, métadonnées

### 2. **Injection de Dépendances**
Les classes principales acceptent les dépendances comme paramètres plutôt que d'utiliser des variables globales :
```javascript
const line = new ZigzagLine(
  canvasWidth,
  canvasHeight,
  getSpawnDistanceFn,
  buildRibbonSidesFn
);
```

### 3. **Système de Modules ES6**
Tout le JavaScript utilise la syntaxe moderne de modules :
```javascript
import { ZigzagLine } from './core/ZigzagLine.js';
export function exportSVG(ZM) { /* ... */ }
```

### 4. **Espace de Noms Global**
Un seul objet `window.SpaceFlow` fournit un accès global organisé :
```javascript
window.SpaceFlow = {
  params,        // Paramètres de l'application
  camera,        // État de la caméra
  emitterInstance, // Référence de l'émetteur principal
  exportSVG(),   // Fonctions d'export
  // ...
};
```

## Lancer l'Application

### Serveur de Développement
```bash
python3 -m http.server 8080
# Ouvrir http://localhost:8080
```

### Exigences du Serveur de Fichiers
Les modules ES6 nécessitent un serveur web (pas le protocole `file://`). N'importe quel serveur HTTP fonctionne :
- Python : `python3 -m http.server`
- Node.js : `npx http-server`
- VS Code : Extension Live Server

## Fonctionnalités Clés

### Rendu Principal
- **WebGL 3D** : Moteur de rendu p5.js WEBGL avec contrôles de caméra
- **Rubans Zigzag** : Géométrie zigzag générée procéduralement
- **Modulation** : Variations aléatoires d'épaisseur et de vitesse
- **Mode Stéréoscopique** : Rendu double canevas compatible VR

### Capacités d'Export
- **PNG** : Export direct du canevas
- **SVG** : Export vectoriel avec mathématiques de projection exactes
- **Carte de Profondeur** : Rendu de profondeur basé CPU avec ajustement automatique
- **Vidéo** : Intégration CCapture.js (WebM/GIF uniquement - MP4 non pris en charge dans les navigateurs)

### Persistance des Paramètres
- **localStorage** : Sauvegarde automatique de tous les paramètres
- **Export/Import JSON** : Partager les configurations sous forme de fichiers
- **Validation** : Vérification des limites des paramètres critiques

### Gestion des Entrées
- **Raccourcis Clavier** : Plus de 20 raccourcis configurables
- **Contrôles Souris** :
  - Glisser gauche : Pivoter la caméra
  - Glisser droit : Déplacer la vue
  - Défilement : Zoom
- **Mode Framebuffer** : Rendu à résolution fixe

## Fichiers de Configuration

### `config/keyboardShortcuts.json`
Définitions centralisées des raccourcis clavier :
```json
[
  {
    "key": "p",
    "action": "exportPNG",
    "description": "Exporter PNG",
    "preventDefault": true
  }
]
```

### `config/uiPresets.json`
Préréglages framebuffer et nuanciers de couleurs :
```json
{
  "framebufferPresets": [
    { "name": "1920x1080", "width": 1920, "height": 1080 }
  ],
  "colorSwatches": [
    [255, 255, 255],
    [80, 200, 255]
  ]
}
```

### `config/appInfo.json`
Métadonnées de l'application et liens de documentation :
```json
{
  "name": "ZigMap26",
  "version": "1.0.0",
  "documentation": { ... }
}
```

## Détails des Modules

### Classes Principales

#### `ZigzagLine`
```javascript
class ZigzagLine {
  constructor(canvasWidth, canvasHeight, getSpawnDistanceFn, buildRibbonSidesFn)
  update(dt)
  draw(p5Instance)
  _alpha()  // Fondu entrée/sortie
  _buildVertices()  // Générer les points zigzag
}
```

#### `Emitter`
```javascript
class Emitter {
  constructor(params, noiseOffsetGetter, canvasWidth, canvasHeight, utilFns)
  update(dt)
  draw(p5Instance)
  _emit()  // Créer une nouvelle ligne
}
```

#### `Camera`
```javascript
class Camera {
  constructor(params)
  syncToParams(params)
  reset()
  resetZoom()
}
```

### Système de Projection

Le système de projection utilise des mathématiques identiques pour tous les exports (SVG, PNG, profondeur) afin d'assurer un alignement pixel-parfait :

1. **Ordre de Rotation** : Z → Y → X (correspond à p5.js WEBGL)
2. **Modèle de Position de la Caméra** : Le panoramique et le zoom sont traités comme des décalages de position de caméra
   - `caméra_x = -décalage_pan_x`
   - `caméra_y = -décalage_pan_y`
   - `caméra_z = caméra_z_par_défaut + distance_zoom`
3. **Transformation de Vue** : `pos_vue = pos_monde_tournée - pos_caméra`
4. **Perspective** : `écran_x = vue_x * (caméra_z / -vue_z) + largeur/2`

Ce modèle est plus clair qu'appliquer des translations au milieu du pipeline de transformation. Lorsque l'utilisateur effectue un panoramique vers la droite, la caméra se déplace effectivement vers la gauche (d'où le signe négatif).

Voir [docs/French/Projection-Matrix-Guide-fr.md](Projection-Matrix-Guide-fr.md) pour les mathématiques détaillées.

## Migration depuis l'Original

Le `ZigzagEmitter_12.html` monolithique original (2 334 lignes) a été refactorisé en une architecture modulaire :
- 1 fichier HTML (330 lignes)
- 3 fichiers CSS (total ~400 lignes)
- 15 modules JavaScript (total ~1 500 lignes)
- Plusieurs fichiers de configuration JSON (total ~200 lignes)

### Changements Incompatibles
- Aucun pour les utilisateurs (clés localStorage préservées)
- Les développeurs doivent utiliser un serveur HTTP (pas `file://`)

### Fonctionnalités Préservées
- Toutes les fonctionnalités originales maintenues
- Chargement automatique des paramètres depuis localStorage
- Raccourcis clavier inchangés
- Formats d'export identiques

## Développement

### Ajout de Nouvelles Fonctionnalités

#### Nouveau Format d'Export
1. Créer `js/export/NouveauExporteur.js`
2. Exporter une fonction : `export function exportNouveau(ZM) { ... }`
3. Importer dans `main.js` et ajouter à `window.SpaceFlow`
4. Connecter au bouton UI dans `UIController.js`

#### Nouveau Paramètre
1. Ajouter à `js/config/defaults.js` dans `DEFAULT_PARAMS`
2. Ajouter un contrôle UI dans `index.html`
3. Connecter curseur/case à cocher dans `UIController.js`
4. Utiliser via `ZM.params.nouveauParametre`

#### Nouveau Raccourci Clavier
1. Ajouter une entrée à `config/keyboardShortcuts.json`
2. Ajouter le gestionnaire d'action dans `KeyboardHandler.js::executeAction()`

## Compatibilité Navigateurs

- **Chrome/Edge** : ✅ Support complet
- **Firefox** : ✅ Support complet
- **Safari** : ✅ Support complet (modules ES6)
- **Mobile** : ⚠️ Limité (pas de clic droit pour déplacer)

## Dépendances

- **p5.js 1.9.0** : Moteur de rendu 3D
- **CCapture.js 1.1.0** : Enregistrement vidéo
- Les deux chargés via CDN dans `index.html`

## Licence

Identique au projet original.

## Contributions

Lors de l'ajout de nouveaux modules :
1. Utiliser la syntaxe `import`/`export` ES6
2. Passer les dépendances comme paramètres (pas de globales sauf `window.SpaceFlow`)
3. Suivre la convention camelCase pour le nommage
4. Documenter les fonctions complexes avec des commentaires JSDoc
5. Tester avec un serveur HTTP avant de committer

## Crédits

**Version Monolithique Originale** : ZigzagEmitter v1-12  
**Architecture Modulaire** : ZigMap26 v1.0  
**Date de Refactorisation** : 9 mars 2026
