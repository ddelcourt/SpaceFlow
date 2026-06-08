# SpaceFlow

ddelcourt2026 / mars 2026

---

## Vue d'ensemble

**SpaceFlow** est un framework modulaire pour l'art génératif 3D en temps réel avec contrôles de caméra, visualisation stéréoscopique, gestion d'états et exportation vectorielle.

**Patch actuel :** Émetteur Zigzag — motifs de rubans animés dans un espace 3D.

SpaceFlow est conçu comme un framework universel capable de charger différents algorithmes visuels (patches) tout en fournissant des systèmes cohérents de caméra, couleurs, export et gestion d'états.

---

## Table des matières

- [Démarrage rapide](#démarrage-rapide)
- [Contrôles de base](#contrôles-de-base)
- [Concepts clés](#concepts-clés)
- [Référence complète de l'interface](#référence-complète-de-linterface)
- [Export](#export)
- [Gestion de projet](#gestion-de-projet)
- [Bonnes pratiques](#bonnes-pratiques)
- [Référence technique](#référence-technique)

---

## Démarrage rapide

1. Ouvrir `index.html` dans un navigateur récent (Chrome, Firefox, Safari, Edge)
2. Un projet de démarrage se charge automatiquement avec des états d'exemple
3. Utiliser clic gauche + glisser pour faire pivoter la caméra
4. Utiliser clic droit + glisser pour déplacer la caméra
5. Faire défiler la molette pour zoomer
6. Appuyer sur Tab pour masquer ou afficher le panneau de contrôle
7. Appuyer sur Entrée pour passer en plein écran

---

## Contrôles de base

### Souris

| Action | Contrôle |
|--------|----------|
| Pivoter la caméra (orbite) | Clic gauche + glisser |
| Déplacer la caméra (décalage 2D) | Clic droit + glisser |
| Rotation Z (roulis) | Clic molette + glisser horizontalement |
| Zoom | Molette |

Les contrôles de caméra sont actifs uniquement lorsque le curseur se trouve sur le canevas. En mode stéréoscopique, les contrôles s'appliquent au canevas sur lequel le clic a été effectué. La sensibilité du défilement est proportionnelle à la distance de la caméra.

**Détails des contrôles :**
- **Contrôle d'orbite** (clic gauche + glisser) : Fait pivoter la caméra autour du centre de la scène (axes X/Y)
- **Contrôle de déplacement** (clic droit + glisser) : Déplace la vue de la caméra dans l'espace 2D sans changer l'angle d'orbite
- **Contrôle de rotation Z** (clic molette + glisser) : Fait pivoter toute la scène autour de l'axe Z, créant un effet de rotation
- **Contrôle de zoom** (molette) : Change la distance de la caméra par rapport au centre de la scène

### Clavier

| Touche | Action | Touche | Action |
|--------|--------|--------|--------|
| Tab | Masquer/afficher panneau UI | Enter | Plein écran |
| P | Exporter PNG | S | Exporter SVG |
| V | Enregistrer vidéo | Ctrl+S (⌘+S) | Sauvegarder projet JSON |
| R | Réinitialiser position caméra | 0 | Réinitialiser zoom (600 unités) |
| 1–4 | Sélectionner palette de couleurs | t | Activer/désactiver épaisseur aléatoire |
| m | Activer/désactiver vitesse aléatoire | y | Activer/désactiver mode stéréoscopique |

---

## Concepts clés

### États

Les états sont des instantanés complets de configuration (paramètres, couleurs, position caméra).

**Utilisation de base :**
1. Ouvrir le panneau États
2. Cliquer sur un état pour le charger avec transition fluide
3. Cliquer sur Sauvegarder pour créer un nouvel état
4. Cliquer sur Mettre à jour pour écraser l'état sélectionné
5. Cliquer sur Supprimer pour retirer un état
6. Double-cliquer sur le nom d'un état pour le renommer
7. **Glisser-déposer** les états pour les réordonner (poignée à gauche)

**Ordre des états :**
- **Glisser-déposer** : Cliquer et faire glisser la poignée ⋮⋮ pour réorganiser
- L'ordre persiste entre les sessions via localStorage
- Lors du chargement d'un preset JSON, le premier état de la liste se charge automatiquement
- Lors de l'actualisation de la page, le dernier état actif se charge automatiquement

**Déclenchement automatique :**
Activer Auto-déclenchement pour alterner automatiquement entre les états. Le curseur Fréquence (5–120 secondes) définit l'intervalle. Un algorithme de mélange garantit que chaque état est visité une fois avant répétition.

**Transitions :**
- Transition d'état (0–30 s) : durée pour les changements de paramètres
- Transition de couleur (0–30 s) : durée pour les changements de palette

### Couleurs

Quatre palettes distinctes, chacune comportant quatre emplacements de couleur. Appuyer sur 1, 2, 3 ou 4 pour changer de palette instantanément.

**Configuration des couleurs :**
- Cliquer sur le sélecteur de couleur pour définir les valeurs RGB
- Définir le rôle de chaque emplacement : Line / Background / None
- Plusieurs emplacements peuvent avoir le même rôle
- Les lignes sélectionnent aléatoirement parmi les couleurs Line disponibles à la génération

Lors du changement de palette, toutes les lignes existantes et l'arrière-plan transitionnent en douceur par interpolation RGB.

**Séparation de profondeur de couleur :**
Contrôle l'espacement sur l'axe Z entre les lignes de différentes couleurs pour réduire le chevauchement (z-fighting). Formule : décalage de chaque emplacement = `(slotIndex - 2) × multiplicateur`.

### Incrustations

Images statiques superposées à l'animation. Incluses dans les exports PNG et vidéo. Exclues des exports SVG.

**Incrustations prédéfinies :**
1. Ouvrir la section Incrustation
2. Sélectionner dans le menu déroulant Préréglage (charge depuis `assets/overlays/`)
3. Activer la case Afficher l'incrustation

**Images personnalisées :**
1. Cliquer sur Charger une image personnalisée
2. Sélectionner un fichier PNG, JPG ou SVG
3. Ajuster les curseurs Échelle, Opacité, Position

Formats pris en charge : PNG (recommandé pour la transparence), JPG, SVG.

---

## Référence complète de l'interface

### Section UI

**Masquer les contrôles** (Tab) : masque le panneau de contrôle. Appuyer à nouveau pour l'afficher.

**Plein écran** (Entrée) : active le mode plein écran du navigateur. Appuyer sur Échap pour quitter.

---

### Section Fichier

**Sauvegarder** (Ctrl+S / ⌘+S) : télécharge les paramètres actuels dans un fichier `.json` horodaté. Tous les paramètres et la position de caméra sont inclus.

**Charger** : ouvre le sélecteur de fichiers pour charger une configuration `.json` précédemment sauvegardée. Tous les paramètres sont appliqués immédiatement et persistés dans le localStorage.

Les paramètres sont automatiquement sauvegardés dans le localStorage à chaque modification.

---

### Section États

- **Liste d'états** : affiche tous les états sauvegardés
- **Sauvegarder** : sauvegarde la configuration actuelle comme nouvel état
- **Mettre à jour** : écrase l'état sélectionné avec la configuration actuelle
- **Supprimer** : retire l'état sélectionné
- **Renommer** : double-cliquer sur le nom de l'état pour le modifier

**Transition d'état** (0–30 s) : durée de transition entre les états.

**Transition de couleur** (0–30 s) : durée des transitions de palette de couleurs.

**Auto-déclenchement** : alterne automatiquement entre les états. Le curseur Fréquence (5–120 s) définit l'intervalle. L'algorithme de mélange garantit que chaque état est visité une fois avant répétition.

---

### Section Caméra

**Vue stéréoscopique (VR)** — par défaut : désactivé  
Divise la vue en perspectives œil gauche et œil droit, côte à côte. Des bordures vertes indiquent le mode actif. Chaque œil occupe la moitié de la largeur de fenêtre.

**Séparation des yeux** — plage : 0–100, par défaut : 30, unités : espace monde  
Distance entre les positions de caméra gauche et droite. Les valeurs élevées accentuent l'effet 3D. Actif uniquement en mode stéréoscopique.

**Résolution framebuffer** — par défaut : désactivé  
Verrouille le canevas à une résolution en pixels spécifique au lieu de la taille de fenêtre. Une bordure grise indique le mode actif. Le canevas se réduit pour s'adapter à la fenêtre si nécessaire.

**Préréglage** — type : menu déroulant, par défaut : 1920×1080  
Sélection rapide des résolutions courantes :

| Préréglage | Résolution |
|------------|------------|
| HD Horizontal | 1920×1080 |
| HD Vertical | 1080×1920 |
| HD Petit Carré | 1080×1080 |
| HD Grand Carré | 1920×1920 |
| 4K Horizontal | 3840×2160 |
| 4K Vertical | 2160×3840 |
| 4K Petit Carré | 2160×2160 |
| 4K Grand Carré | 3840×3840 |
| Bannière web | 3500×1500 |
| Publication Instagram | 1080×1440 |
| Personnalisé | — |

Actif uniquement en mode framebuffer.

**Résolution (Largeur × Hauteur)** — par défaut : 1920×1080, minimum : 320×240  
Saisie manuelle des dimensions en pixels. Modifier ces valeurs règle le préréglage sur « Personnalisé ».

**Champ de vision** — plage : 0.01–180°, par défaut : 60°  
Les valeurs faibles (30–40°) produisent un rendu architectural. Les valeurs élevées (90–120°) accentuent la perspective.

**Plans de découpe** — proche : 0.01–500, lointain : 500–20 000, par défaut : 0.01 / 20 000  
Définit la portion visible de l'espace 3D. À ajuster si la géométrie apparaît tronquée aux niveaux de zoom extrêmes.

---

### Fenêtre d'affichage (Synchronisation multi-écran)

**Bouton Ouvrir Fenêtre d'Affichage** (situé dans la section Projet)  
Ouvre des fenêtres secondaires plein écran pour les présentations multi-écrans. Les fenêtres d'affichage reproduisent l'animation de la fenêtre principale en temps réel, synchronisées via diffusion intelligente de paramètres. Vous pouvez ouvrir plusieurs fenêtres d'affichage en cliquant plusieurs fois sur le bouton—chacune reçoit un ID séquentiel unique (display-1, display-2, display-3, etc.).

**Stratégie de synchronisation duale :**

Le système utilise deux approches de diffusion différentes pour des performances optimales :

1. **Transitions d'états** (animations fluides) :
   - Lors du chargement d'états ou de la modification de paramètres via l'interface, la fenêtre principale diffuse des commandes de transition
   - Les fenêtres d'affichage reçoivent les commandes et exécutent des transitions fluides identiques localement
   - Position de la caméra, FOV, échelle de géométrie et rotation de l'émetteur transitent tous en parfaite synchronisation
   - Résultat : Animations synchronisées image par image avec une bande passante minimale (1 commande par transition)
   - Exemples : Chargement d'un nouvel état, navigation dans l'historique des états, transition caméra/géométrie

2. **Contrôle manuel de la caméra** (temps réel) :
   - Pendant le glissement de la souris, le déplacement, le zoom ou la rotation Z, la fenêtre principale diffuse les mises à jour de position de la caméra à 60 images par seconde
   - Les fenêtres d'affichage s'alignent instantanément pour correspondre aux mouvements de contrôle manuel
   - Le contrôle manuel remplace toute transition en cours pour une réactivité immédiate
   - Résultat : Suivi réactif en temps réel pendant la performance en direct ou l'interaction
   - Exemples : Glisser pour orbiter la caméra, glisser avec la molette pour la rotation Z, zoom avec la molette

**Fonctionnement :**
- La fenêtre principale diffuse les changements de paramètres et les commandes aux fenêtres d'affichage via l'API BroadcastChannel
- Chaque fenêtre exécute son propre code génératif indépendant en utilisant les paramètres synchronisés
- Les deux fenêtres génèrent leurs animations de manière indépendante en se basant sur les mêmes valeurs d'état

**Important : Transitions synchronisées vs variation générative**

Le système réalise une **synchronisation de transition image par image** tout en maintenant une **exécution générative indépendante** :

**Ce qui EST parfaitement synchronisé :**
- **Transitions de caméra** : Rotation, distance, panoramique s'interpolent de manière identique sur tous les affichages
- **Transitions de géométrie** : Les changements d'échelle s'animent en parfaite synchronisation
- **Transitions FOV** : Les changements de champ de vision correspondent image par image
- **Transitions de couleurs** : Les changements de palette se produisent simultanément
- **Paramètres d'état** : Tous les paramètres restent parfaitement synchronisés

**Ce qui varie par conception :**
- **Génération de lignes** : Chaque fenêtre crée de nouvelles lignes indépendamment avec son propre timing
- **Variations aléatoires** : L'épaisseur, la vitesse et la sélection de couleur utilisent des graines aléatoires indépendantes
- **Timing de rendu** : Les cycles de frames du navigateur peuvent différer légèrement

Les affichages principal et secondaire afficheront des **vues de caméra et transitions identiques** mais avec des **motifs de lignes uniques**. Ceci est intentionnel et offre :

1. **Synchronisation de transition** : Lorsque les états changent, tous les affichages s'animent fluidemont ensemble vers la nouvelle configuration caméra/géométrie

2. **Synchronisation générative basée sur les paramètres** : Le système synchronise les *règles et paramètres* (couleurs, géométrie, caméra, taux d'émission, etc.), et non les lignes individuelles. Chaque fenêtre génère sa propre variation unique suivant les mêmes règles.

3. **Pipelines d'animation indépendants** : Chaque fenêtre exécute son propre rendu WebGL avec génération aléatoire indépendante, créant une variété visuelle tout en maintenant une structure synchronisée.

**Pourquoi cette approche est plus efficace que la diffusion d'images :**

- **Bande passante inférieure** : Diffuser des mises à jour de paramètres compactes et des commandes de transition (octets) est beaucoup plus efficace que diffuser des trames vidéo haute résolution (mégaoctets par seconde)
- **Meilleures performances** : Chaque fenêtre effectue un rendu natif à sa propre résolution et taux de rafraîchissement, évitant les artefacts de compression vidéo
- **Accélération matérielle** : Chaque fenêtre utilise l'accélération GPU complète pour le rendu WebGL, maintenant des performances fluides à 60 images par seconde
- **Évolutivité** : Plusieurs fenêtres d'affichage peuvent se connecter sans augmenter exponentiellement le transfert de données
- **Indépendance de résolution** : Chaque affichage peut fonctionner à sa résolution optimale sans réduction d'échelle du contenu diffusé
- **Transitions image par image** : Les commandes de transition dédiées assurent des animations synchronisées fluides sur tous les affichages
- **Synchronisation intelligente** : Les transitions d'états utilisent des commandes uniques tandis que le contrôle manuel utilise des mises à jour à 60fps — optimal pour chaque cas d'utilisation

**Contrôle clavier bidirectionnel**

Les fenêtres d'affichage prennent en charge le **contrôle clavier à distance**, vous permettant de piloter l'ensemble du système depuis n'importe quelle fenêtre d'affichage. C'est idéal pour les performances en direct où vous regardez la sortie du projecteur plutôt que la fenêtre de contrôle.

**Touches prises en charge depuis les fenêtres d'affichage :**
- **Flèches directionnelles** (← →) : Naviguer dans l'historique des états (état précédent/suivant)
- **Barre d'espace** : Lecture/pause du déclenchement automatique
- **Touches numériques** (1–4) : Sélectionner les palettes de couleurs
- **Touches d'export** : P (PNG), S (SVG), D (Profondeur), V (Vidéo), Ctrl+S/⌘+S (Sauvegarder projet)
- **Touches caméra** : R (Réinitialiser caméra), 0 (Réinitialiser zoom)

**Fonctionnement :**
1. Appuyez sur une touche dans n'importe quelle fenêtre d'affichage
2. La commande est envoyée à la fenêtre principale via BroadcastChannel
3. La fenêtre principale traite la commande (ex : charge l'état suivant)
4. La fenêtre principale diffuse le résultat à tous les affichages
5. Tous les affichages (y compris celui qui a envoyé la commande) se synchronisent avec le nouvel état

La fenêtre principale reste toujours la source unique de vérité, garantissant un comportement cohérent sur tous les affichages
- **Synchronisation intelligente** : Commandes de transition pour des animations fluides avec une surcharge minimale, mises à jour en temps réel pour un contrôle manuel réactif

Cette approche de synchronisation générative est idéale pour les installations en direct, les configurations multi-projecteurs et les contextes de performance où un rendu fluide et de haute qualité sur plusieurs affichages est essentiel.

---

### Section Géométrie

**Hauteur de géométrie** — plage : 10–240, par défaut : 120, unités : pixels

**Épaisseur de ligne** — plage : 1–60, par défaut : 8, unités : pixels  
Largeur du ruban zigzag. Les lignes épaisses peuvent se chevaucher ; les lignes fines produisent des motifs plus délicats.

**Échelle de géométrie** — plage : 100–400%, par défaut : 100%  
Mise à l'échelle globale de l'espace. N'affecte pas la taille du canevas.

---

### Section Comportement

**Taux d'émission** — plage : 0.1–10, par défaut : 1.5, unités : lignes par seconde  
Fréquence de création de nouvelles lignes. Les valeurs élevées densifient l'écran ; les valeurs faibles espacent l'animation.

**Vitesse** — plage : 10–500, par défaut : 80, unités : pixels par seconde  
Vitesse de déplacement des lignes dans l'espace.

---

### Section Modulations

**Épaisseur aléatoire** (t) — par défaut : désactivé  
Applique une variation aléatoire à l'épaisseur de chaque ligne.

**Plage d'épaisseur** — plage : 10%–400%, par défaut : 10%–200%  
Variation minimale et maximale quand l'épaisseur aléatoire est activée.

**Vitesse aléatoire** (m) — par défaut : désactivé  
Applique une variation aléatoire à la vitesse de chaque ligne.

**Plage de vitesse** — plage : 10%–400%, par défaut : 30%–200%  
Variation minimale et maximale quand la vitesse aléatoire est activée.

---

### Section Couleurs

**Palettes de couleurs**  
Quatre palettes distinctes, chacune comportant quatre emplacements de couleur. Les touches 1, 2, 3, 4 permettent de basculer entre les palettes.

**Personnalisation des couleurs**  
Chaque emplacement dispose d'un sélecteur de couleur (RGB) et d'un rôle :
- **Line** : couleur des rubans zigzag (sélection aléatoire à la génération)
- **Background** : couleur d'arrière-plan du canevas
- **None** : emplacement désactivé

Plusieurs emplacements peuvent avoir le même rôle.

**Séparation de profondeur de couleur** — plage : 10–500, par défaut : 100  
Contrôle l'espacement sur l'axe Z entre les lignes de différentes couleurs. Les valeurs élevées réduisent le chevauchement visuel (z-fighting). Formule : décalage de chaque emplacement = `(slotIndex - 2) × multiplicateur`.

**Transitions de couleur**  
Lors du changement de palette, toutes les lignes existantes et l'arrière-plan transitionnent en douceur sur la durée configurée par interpolation linéaire RGB.

---

### Section Incrustation

**Afficher l'incrustation**  
Case à cocher pour activer/désactiver la visibilité de l'image d'incrustation. L'image reste chargée lorsqu'elle est masquée.

**Menu déroulant Préréglage**  
Incrustations préconfigurées du dossier `assets/overlays/`. Chargement instantané des images encodées en Base64. Sélectionner « -- Image personnalisée -- » pour charger votre propre fichier.

**Charger une image personnalisée**  
Ouvre le sélecteur de fichiers pour importer une image. Formats pris en charge : PNG, JPG, SVG. Image encodée en Base64 temporairement. Active automatiquement la case Afficher l'incrustation. Remplace la sélection de préréglage.

**Échelle** — plage : 10%–200%, par défaut : 100%  
Redimensionne l'image d'incrustation.

**Opacité** — plage : 0%–100%, par défaut : 100%  
Contrôle la transparence de l'incrustation.

**Position X / Y** — plage : 0%–100%, par défaut : 50% / 50%  
Place l'incrustation n'importe où sur l'écran. 0%, 0% = coin supérieur gauche ; 100%, 100% = coin inférieur droit ; 50%, 50% = centré.

**Comportement à l'export**  
Les incrustations sont incluses dans les exports PNG et vidéo. Exclues des exports SVG (vecteur uniquement). Pour exporter sans incrustation : décocher Afficher l'incrustation avant l'export.

---

### Section Export

**Exporter PNG** (P) — format : `.png`  
Capture directe du canevas avec transparence. Les dimensions correspondent au canevas actuel (ou aux dimensions du framebuffer si activé).

**Exporter SVG** (S) — format : `.svg`  
Version vectorielle de l'image actuelle, ligne par ligne avec projection exacte. Mise à l'échelle infinie sans perte de qualité.

**Enregistrement vidéo** — format : `.webm` (recommandé) ou `.gif`  
Capture image par image pour un rendu fluide et déterministe. Démarrage/arrêt depuis l'interface de la section Export. Un indicateur rouge s'affiche pendant l'enregistrement. Le fichier s'exporte automatiquement à l'arrêt.

⚠️ **Note :** L'export MP4 n'est pas disponible dans les navigateurs. Exportez en WebM et convertissez avec **Shutter Encoder** si nécessaire (voir Dépannage).

---

## Export

### Formats d'export

| Format | Type | Cas d'usage | Évolutivité |
|--------|------|-------------|-------------|
| PNG | Matriciel | Web, réseaux sociaux | Dimensions fixes |
| SVG | Vectoriel | Impression, design, édition | Infinie |
| Vidéo | Temporel | Animation, présentation | Résolution vidéo |

### Export rapide

**Image actuelle :**
- P : exporter image PNG (inclut l'incrustation)
- S : exporter fichier vectoriel SVG

**Enregistrement vidéo :****
1. Cliquer sur le bouton Démarrer l'enregistrement dans la section Export
2. Cliquer sur le bouton Arrêter l'enregistrement (optionnel, arrêt automatique à la durée configurée)
3. La vidéo se télécharge automatiquement avec l'incrustation incluse

---

## Gestion de projet

### Sauvegarder un projet

1. Cliquer sur le bouton Sauvegarder dans la section Fichier (ou appuyer sur Ctrl+S / ⌘+S)
2. Le fichier JSON du projet se télécharge avec horodatage
3. Contient tous les états, paramètres et positions de caméra

### Charger un projet

1. Cliquer sur le bouton Charger dans la section Fichier
2. Sélectionner le fichier JSON sauvegardé
3. Le projet se restaure immédiatement

Les paramètres sont automatiquement sauvegardés dans le localStorage à chaque modification. Au premier lancement, un projet de démarrage avec des états d'exemple se charge depuis `config/presets/Init.json`.

**Comportement du localStorage :**
- Les paramètres sont automatiquement sauvegardés à chaque modification
- L'ordre de la liste d'états et l'état actif persistent entre les sessions
- **Chargement des presets via URL** :
  - Première visite avec `?preset=Nom` → charge ce preset
  - Visite ultérieure avec même URL de preset → utilise vos données localStorage (personnalisations préservées)
  - Visite avec URL de preset **différent** → charge le nouveau preset (remplace localStorage)
  - Actualisation sans paramètre URL → charge vos données localStorage et dernier état actif

---

## Bonnes pratiques

### Performance

- Réduire le taux d'émission pour améliorer les performances sur les systèmes lents
- Le mode framebuffer haute résolution (4K) demande davantage de GPU
- Le mode stéréoscopique effectue deux rendus simultanés ; réduire la résolution en cas de ralentissement
- Masquer le panneau UI (Tab) pour des performances maximales

### Composition

- Positionner les éléments clés hors du centre
- Utiliser la rotation de caméra pour révéler les couches spatiales
- Les couleurs vives sur fond sombre produisent un contraste élevé
- Ajuster la Séparation de profondeur de couleur pour prévenir le z-fighting

### Visualisation VR

- Commencer avec une séparation de 30 et ajuster selon la distance de l'écran
- Éviter une séparation excessive pour limiter la fatigue oculaire

### Enregistrement

- Définir tous les paramètres avant de commencer l'enregistrement
- Fermer les autres applications pour libérer des ressources
- Les enregistrements courts (10–30 secondes) sont plus faciles à gérer

### Export réseaux sociaux

- Instagram : préréglage 1080×1440
- Bannière web : préréglage 3500×1500
- Twitter/X : 1920×1080 pour les publications vidéo

---

## Référence technique

### Commandes Console

Pour le contrôle avancé, le débogage et l'automatisation, voir :
- **[Référence des Commandes Console](Console-Commands-fr.md)** — Liste complète des commandes console du navigateur et des fonctions API globales

### Structure du projet

```
/
├── index.html              Fichier application principal
├── css/                    Feuilles de style
├── js/                     Modules JavaScript
│   ├── main.js            Point d'entrée
│   ├── core/              Framework core (Camera, Projection, utils)
│   │                      + Patch actuel : Zigzag (Emitter, ZigzagLine)
│   ├── ui/                Contrôleurs UI
│   ├── storage/           Gestion états et localStorage
│   ├── input/             Gestionnaires souris et clavier
│   ├── export/            Exporteurs PNG, SVG, carte profondeur, vidéo
│   ├── rendering/         SketchFactory (intégration p5.js)
│   └── config/            Constantes et valeurs par défaut
├── config/                Fichiers de configuration
│   ├── appInfo.json       Métadonnées de l'application
│   ├── keyboardShortcuts.json  Raccourcis clavier
│   ├── uiPresets.json     Configuration UI
│   ├── overlayPresets.js  Liste des fichiers d'incrustation
│   └── presets/           Configurations préréglées
│       ├── manifest.json  Registre des préréglages
│       └── Init.json         Projet de démarrage par défaut
├── assets/overlays/       Préréglages d'incrustation encodés en Base64
└── utilities/             Outil de conversion d'incrustation
```

### Développement

JavaScript vanilla (modules ES6) avec p5.js pour le rendu WebGL.

**Dépendances principales :**
- p5.js v1.9.0 (mode WebGL)
- CCapture.js v1.1.0 (capture vidéo)

**Architecture :**
- **Conception framework-first** : Systèmes universels (caméra, couleurs, export, stockage) indépendants de l'algorithme visuel
- **Système de patches** : L'implémentation actuelle est le patch Émetteur Zigzag
- **ES6 modulaire** : Fichiers séparés pour chaque composant
- **Gestion d'état** : Snapshots complets via localStorage
- **Projection CPU** : Permet les exports SVG et carte de profondeur

**Voir aussi :**
- **[Architecture SpaceFlow](../English/SPACEFLOW-ARCHITECTURE.md)** — Conception complète du framework et stratégie de découplage
- **[Système de Patches](../English/PATCH-SYSTEM.md)** — Comment les patches s'intègrent au framework

### Dépannage

**Les lignes n'apparaissent pas**  
Vérifier que le taux d'émission > 0. Ajuster la distance de caméra avec la molette.

**Problèmes de découpe**  
Ajuster les plans de découpe proche/lointain dans la section Caméra aux niveaux de zoom extrêmes.

**Le déplacement ne fonctionne pas**  
La distance de caméra doit être ≥ 50. Dézoomer si nécessaire.

**Les paramètres ne sont pas sauvegardés**  
Vérifier que les permissions localStorage du navigateur sont activées.

**Fichier vidéo trop volumineux**  
Réduire la durée, la fréquence d'images ou la résolution dans la section Export.

**Animation saccadée**  
Réduire le taux d'émission ou fermer d'autres programmes. Désactiver l'épaisseur/vitesse aléatoire si le décalage persiste.

**L'incrustation ne s'affiche pas**  
Vérifier la case Afficher l'incrustation. Vérifier l'opacité > 0%. S'assurer que l'image s'est chargée correctement.

**Le renommage d'état échoue**  
Cliquer directement sur le texte du nom de l'état. Éviter de déclencher les raccourcis clavier pendant le renommage.

**Les raccourcis clavier ne fonctionnent pas**  
S'assurer que le mode de renommage d'état n'est pas actif. Les raccourcis sont désactivés pendant l'édition des noms d'états.

### Historique des versions

**v26 (actuelle)**
- Système de gestion d'états : sauvegarder/charger plusieurs états avec transitions fluides
- Contrôle de durée de transition de couleur séparé
- Changement d'état automatique par déclenchement avec algorithme de mélange
- Positions de caméra sauvegardées par état
- Système d'image d'incrustation : importer PNG/JPG/SVG, échelle/opacité/position ajustables
- Préréglages d'incrustation du dossier `assets/overlays/` avec encodage Base64
- Composition automatique d'incrustation dans les exports PNG et vidéo
- Correction PixelDensity pour écrans haute résolution
- Expérience utilisateur première fois : charge automatiquement un projet de démarrage avec états d'exemple
- Panneaux de contrôle séparés : Rendu (framebuffer) et Vue (FOV, découpe, stéréoscopique)
- Le chargement de projet utilise le premier état et synchronise les contrôles de caméra
- Architecture modulaire ES6 avec fichiers de classe séparés
- Touche Tab pour masquer les contrôles
- Raccourcis clavier désactivés pendant le renommage d'état

**Versions antérieures (v12 et inférieures)**
- Export carte de profondeur avec mise à l'échelle automatique
- Projection CPU pour cartes de profondeur
- Système centralisé de raccourcis clavier
- Compensation FOV pour distance de caméra
- Contrôles de caméra à la souris (orbite, déplacement, zoom)
- Mode de visualisation stéréoscopique
- Contrôle de résolution framebuffer
- Modulations d'épaisseur/vitesse aléatoires
- Capacités d'export SVG/PNG/vidéo
- Persistance localStorage

### Compatibilité navigateurs

- Chrome/Edge : support complet
- Firefox : support complet
- Safari : support complet
- Navigateurs mobiles : limité (pas de contrôles souris)

Configuration minimale requise : support WebGL, JavaScript ES6, API Canvas 2D, support téléchargement de fichiers.

### Crédits et licence

- p5.js (v1.9.0) - Framework de codage créatif
- CCapture.js (v1.1.0) - Capture d'images pour export vidéo
- ddelcourt2026 / Développé pour TheSpaceLab / Mapping 2026

MIT License — CC BY-NC-SA — ddelcourt 2026
