# Format JSON des Presets

Documentation pour la structure des fichiers preset de SpaceFlow.

---

## Emplacement des Fichiers

Les fichiers preset sont stockés dans `config/presets/` et enregistrés dans `config/presets/manifest.json`.

---

## Structure de Fichier

### Format Version 2.0 (Actuel)

```mermaid
graph TB
    Root["Fichier Preset (.json)"]
    
    Root --> Version["version: '2.0'"]
    Root --> Params["params: { }"]
    Root --> States["states: [ ]"]
    Root --> Active["activeStateId: 'id'"]
    Root --> Overlay["overlayPresetFiles: [ ]"]
    Root --> Date["saveDate: horodatage ISO"]
    
    Params --> Geo["Paramètres Géométrie"]
    Params --> Color["Paramètres Couleur"]
    Params --> Anim["Paramètres Animation"]
    Params --> Cam["Paramètres Caméra"]
    Params --> Exp["Paramètres Export"]
    
    States --> State1["État 1 (charge en premier)"]
    States --> State2["État 2"]
    States --> StateN["État N"]
    
    Overlay --> Over1["Fichier 1 (niveau projet)"]
    Overlay --> Over2["Fichier 2 (partagé)"]
    
    style Root fill:#2d3748,stroke:#4299e1,color:#fff
    style Params fill:#2c5282,stroke:#90cdf4,color:#fff
    style States fill:#1a365d,stroke:#63b3ed,color:#fff
    style Overlay fill:#22543d,stroke:#68d391,color:#fff
```

```json
{
  "version": "2.0",
  "params": { /* Paramètres de l'application */ },
  "states": [ /* Configurations d'états */ ],
  "activeStateId": "state_id_here",
  "overlayPresetFiles": [ /* Fichiers d'overlay disponibles */ ],
  "saveDate": "2026-03-20T10:30:00.000Z"
}
```

### Champs de Niveau Supérieur

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `version` | string | Oui | Version du format (actuellement "2.0") |
| `params` | object | Oui | Paramètres actuels de l'application |
| `states` | array | Non | Tableau de configurations d'états sauvegardées (l'ordre compte) |
| `activeStateId` | string | Non | ID de l'état actuellement actif |
| `overlayPresetFiles` | array | Non | Liste des noms de fichiers d'overlay disponibles |
| `saveDate` | string | Non | Horodatage ISO de création du fichier |

**Note sur l'ordre du tableau `states` :**
- Lors du premier chargement d'un preset, le **premier état** du tableau est chargé automatiquement.
- L'ordre des états peut être modifié par les utilisateurs via glisser-déposer dans l'interface.
- L'ordre modifié persiste dans localStorage et est conservé au rechargement de la page.

---

## Objet Parameters

### Paramètres de Géométrie

```json
{
  "segmentLength": 120,        // Longueur de chaque segment zigzag (10-500)
  "lineThickness": 26.8,       // Largeur des rubans (1-200)
  "emitterRotation": 222,      // Angle de rotation en degrés (0-360)
  "geometryScale": 158,        // Pourcentage de facteur d'échelle (1-500)
  "fadeDuration": 1            // Durée du fondu entrant/sortant en secondes (0-10)
}
```

### Paramètres de Couleur

```json
{
  "palettes": [
    [
      { "rgb": [224, 211, 188], "role": "line" },
      { "rgb": [0, 0, 0], "role": "background" },
      { "rgb": [180, 180, 180], "role": "line" },
      { "rgb": [33, 33, 33], "role": "none" }
    ]
  ],
  "activePaletteIndex": 0,           // Palette active (0-3)
  "colorTransitionDuration": 16,     // Temps de transition de couleur en secondes
  "colorSlotZOffset": 90,            // Décalage Z par slot de couleur (empêche le z-fighting)
  "colorRandomSeed": 1               // Graine pour la sélection déterministe des couleurs (1-9999)
}
```

**Rôles de Couleur :**
- `"line"` — Couleur de dessin active
- `"background"` — Couleur de fond du canvas
- `"none"` — Inactif (non utilisé pour le rendu)

**Note :** Chaque palette contient exactement 4 slots de couleur. Plusieurs couleurs peuvent avoir le rôle "line".

### Paramètres d'Animation

```json
{
  "emitRate": 1.1,              // Lignes émises par seconde (0.1-10)
  "speed": 69,                  // Pourcentage de vitesse de mouvement (1-500)
  "ambientSpeedMaster": 100     // Multiplicateur de vitesse global en pourcentage (1-500)
}
```

### Paramètres de Modulation

```json
{
  "randomThickness": true,      // Activer la randomisation de l'épaisseur
  "randomSpeed": false,         // Activer la randomisation de la vitesse
  "thicknessRangeMin": 10,      // Épaisseur minimale quand randomisée
  "thicknessRangeMax": 200,     // Épaisseur maximale quand randomisée
  "speedRangeMin": 50,          // Vitesse minimale quand randomisée
  "speedRangeMax": 150          // Vitesse maximale quand randomisée
}
```

### Paramètres de Caméra

```json
{
  "fov": 99.01,                 // Champ de vision en degrés (1-179)
  "near": 0.01,                 // Plan de découpage proche
  "far": 5000,                 // Plan de découpage distant
  "cameraRotationX": -2.53,     // Rotation verticale en radians
  "cameraRotationY": -0.06,     // Rotation horizontale en radians
  "cameraDistance": 600,        // Distance de zoom (50-5000)
  "cameraOffsetX": 316,         // Décalage de panoramique horizontal
  "cameraOffsetY": -425         // Décalage de panoramique vertical
}
```

### Paramètres de Déclenchement Automatique

```json
{
  "autoTriggerStates": false,   // Activer les transitions d'états automatiques
  "autoTriggerFrequency": 25,   // Secondes entre les transitions (5-240)
  "stateTransitionDuration": 12 // Durée de transition en secondes
}
```

### Paramètres Stéréoscopiques

```json
{
  "stereoscopicMode": false,    // Activer le rendu stéréo VR/3D
  "eyeSeparation": 30           // Distance entre les caméras gauche/droite
}
```

### Paramètres de Framebuffer

```json
{
  "framebufferMode": false,     // Activer le rendu à résolution fixe
  "framebufferPreset": "1080x1080",
  "framebufferWidth": 1080,
  "framebufferHeight": 1080,
  "canvasBorderVisible": false, // Afficher/masquer la bordure du canevas
  "canvasBorderColor": "#adff2f" // Couleur de bordure au format hexadécimal
}
```

### Paramètres d'Export

```json
{
  "videoDuration": 10,          // Durée d'enregistrement vidéo en secondes
  "videoFPS": 30,               // Images par seconde de la vidéo
  "videoFormat": "webm",        // Format vidéo ("webm" ou "gif" uniquement)
  "depthInvert": false          // Inverser la carte de profondeur (blanc=loin, noir=près)
}
```

**Note :** Le format MP4 n'est pas pris en charge dans les navigateurs en raison de la licence du codec. Seuls WebM et GIF sont disponibles. Pour convertir WebM vers MP4, utilisez **Shutter Encoder** (https://github.com/paulpacifico/shutter-encoder) — un convertisseur gratuit et professionnel avec accélération GPU.

### Paramètres d'Overlay

```json
{
  "overlayImageSrc": null,      // Données d'image en base64 ou null
  "overlayPresetFile": null,    // Nom du fichier de superposition préréglé sélectionné
  "overlayCustomFilename": null, // Nom du fichier de superposition personnalisé téléchargé
  "overlayCustomImageSrc": null, // URL de données source de la superposition personnalisée téléchargée
  "overlayVisible": false,      // Afficher/masquer l'overlay
  "overlayAutoFit": false,      // Ajuster automatiquement la superposition aux dimensions du canevas
  "overlayScale": 32,           // Taille de l'overlay en pourcentage (1-200)
  "overlayOpacity": 100,        // Transparence de l'overlay (0-100)
  "overlayX": 50,               // Position horizontale en pourcentage (0-100)
  "overlayY": 50                // Position verticale en pourcentage (0-100)
}
```

---

## Tableau States

Chaque état contient :

```json
{
  "id": "state_1773371830542_jrv4aki30",
  "name": "Simple",
  "timestamp": 1773371830543,
  "params": { /* Sous-ensemble de paramètres qui changent entre les états */ },
  "camera": {
    "rotationX": -3.195,
    "rotationY": 3.130,
    "distance": 1926.056,
    "offsetX": -26,
    "offsetY": -39
  },
  "metadata": {
    "version": "1.0"
  }
}
```

### Champs d'État

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique (auto-généré) |
| `name` | string | Nom d'état défini par l'utilisateur |
| `timestamp` | number | Horodatage Unix de création |
| `params` | object | Paramètres spécifiques à cet état |
| `camera` | object | Instantané de configuration de caméra |
| `metadata` | object | Métadonnées d'état supplémentaires |

**Note :** Les `params` d'état contiennent généralement uniquement les paramètres de géométrie, couleur, modulation et caméra. Les paramètres globaux comme le mode framebuffer ne sont pas spécifiques aux états.

---

## Fichier Manifest

`config/presets/manifest.json` enregistre les presets disponibles :

```json
{
  "presets": [
    {
      "filename": "Init.json",
      "name": "zigmap_init",
      "type": "Init"
    },
    {
      "filename": "zigmap_horizon3.json",
      "name": "zigmap_horizon3",
      "type": "Preset"
    }
  ]
}
```

---

## Bonnes Pratiques

### Plages de Paramètres

- Maintenez `near` au-dessus de 0.01 pour éviter les problèmes de rendu
- Maintenez `far` en dessous de 5000 pour les performances
- Utilisez `colorSlotZOffset` entre 10-100 pour éviter le z-fighting

### Palettes de Couleurs

- Incluez toujours exactement une couleur `"background"` par palette
- Incluez au moins une couleur `"line"` par palette
- Utilisez `"none"` pour les slots inactifs

### Nommage des Fichiers

- Utilisez des caractères alphanumériques minuscules et des underscores
- Modèle : `zigmap_nom_descriptif.json`
- Gardez les noms sous 32 caractères

### Performance

- Réduisez `emitRate` et `speed` pour des performances plus fluides
- Réduisez `geometryScale` si le rendu est lent
- Désactivez `stereoscopicMode` quand non nécessaire

---

## Chargement des Presets

Les presets peuvent être chargés :

1. **Au démarrage** — `Init.json` se charge au premier lancement
2. **Via URL** — `index.html?preset=filename` (sans l'extension .json)
3. **Via la page d'accueil** — Cliquez sur les boutons de preset
4. **Via upload de fichier** — Glisser-déposer ou utiliser le sélecteur de fichiers

---

## Validation

L'application valide les presets chargés :

- Les paramètres manquants reviennent aux valeurs par défaut de `js/config/defaults.js`
- Les valeurs de couleur invalides reviennent par défaut au blanc/noir
- Les nombres hors plage sont limités aux plages valides
- Les structures de palette corrompues sont remplacées par des palettes par défaut

---

## Historique des Versions

### Version 2.0 (Actuelle)
- Introduction de la gestion des états
- Ajout des champs `states` et `activeStateId`
- Support de plusieurs configurations nommées par fichier

### Version 1.0 (Héritée)
- Un seul ensemble de paramètres par fichier
- Pas de gestion d'états
- Toujours supportée pour la rétrocompatibilité
