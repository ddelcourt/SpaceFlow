# ZigMap Emitter — Manuel utilisateur

---

## Démarrage

1. Ouvrir `index.html` dans un navigateur web.
2. L'animation commence.
3. Interagir avec la souris.
4. Ajuster les paramètres dans le panneau de gauche.
5. Exporter en images ou vidéos.

---

## Contrôles souris

| Action | Contrôle |
|--------|----------|
| Faire pivoter la vue | Clic gauche + glisser |
| Déplacer la vue | Clic droit + glisser |
| Zoom | Molette |

Les contrôles souris sont actifs uniquement lorsque le curseur se trouve sur la zone d'animation, pas sur le panneau de contrôle.

---

## Raccourcis clavier

| Touche | Action |
|--------|--------|
| Tab | Masquer / afficher le panneau de contrôle |
| Entrée | Plein écran |
| P | Exporter PNG (inclut l'overlay) |
| S | Exporter SVG (vectoriel uniquement) |
| D | Exporter carte de profondeur |
| R | Réinitialiser la caméra |
| 0 | Réinitialiser le zoom |
| 1 – 4 | Sélectionner une palette de couleurs |
| y | Activer / désactiver la vue stéréoscopique |
| Ctrl+S (⌘+S) | Sauvegarder projet |

Les exports PNG incluent automatiquement l'overlay si celui-ci est actif. L'enregistrement vidéo est disponible depuis l'interface de la section Export.

---

## Contrôles principaux (panneau gauche)

### Projet

- **Save** : télécharge le projet complet (états et positions caméra) en fichier JSON.
- **Load** : ouvre un projet précédemment sauvegardé.

Au premier lancement, un projet de démarrage avec des états d'exemple se charge automatiquement.

---

### États (States)

Les états sont des instantanés complets des paramètres. Ils permettent de mémoriser et de rappeler différentes configurations.

- **Liste des états** : affiche tous les états sauvegardés.
- Cliquer sur un état dans la liste le charge avec une transition animée.
- **Save** : enregistre la configuration actuelle comme nouvel état.
- **Update** : écrase l'état sélectionné avec la configuration actuelle.
- **Delete** : supprime l'état sélectionné.
- **Renommer** : cliquer sur le nom d'un état pour le modifier.
- **Réordonner** : glisser-déposer les états avec la poignée ⋮⋮ sur la gauche.

**Ordre et initialisation des états :**
- L'ordre des états est préservé dans le localStorage entre les sessions.
- Lors du chargement d'un fichier preset JSON, le **premier état** de la liste se charge automatiquement.
- Lors de l'actualisation de la page ou du retour à l'application, le **dernier état actif** se charge automatiquement.

**Contrôles de transition**
- **State Transition** (0–30 s) : durée de transition entre états.
- **Color Transition** (0–30 s) : durée de transition des palettes de couleurs.

**Auto-Trigger**
Cocher **Auto-Trigger** pour alterner automatiquement entre les états. Le curseur **Frequency** (5–120 s) définit l'intervalle. Un algorithme de mélange assure que chaque état est visité une fois avant répétition.

---

### Palettes de couleurs

Quatre palettes distinctes, chacune comportant quatre emplacements de couleur.

- Sélectionner une palette via les boutons **1–4** en haut de la section ou les touches correspondantes.
- Cliquer sur un sélecteur de couleur pour modifier une teinte.
- Attribuer un rôle à chaque couleur : **Line** (lignes zigzag), **Background** (arrière-plan) ou **None** (désactivé).
- **Color Depth Separation** : espacement sur l'axe Z entre lignes de différentes couleurs.

Lors du changement de palette, les lignes existantes transitionnent en douceur vers les nouvelles couleurs.

---

### Rendu (Rendering)

Contrôles de résolution de sortie, appliqués aux exports.

- **Framebuffer Resolution** : cocher pour verrouiller le canevas à une résolution fixe.
- **Preset** : sélection rapide parmi les résolutions courantes (HD, 4K, formats Instagram).
- **Resolution** : saisie manuelle de la largeur et de la hauteur en pixels.

---

### Vue (View)

- **Field of View** : angle de l'objectif (60° standard, 90° et plus pour un effet dramatique).
- **Clipping Planes** : plages de visibilité Near / Far.
- **Stereoscopic View (VR)** : active le mode VR côte à côte.
- **Eye Separation** : distance entre les deux caméras stéréo.

---

### Géométrie

- **Segment Length** : longueur de chaque segment zigzag.
- **Line Thickness** : épaisseur des lignes.
- **Emitter Rotation** : rotation du motif d'émission.
- **Geometry Scale** : multiplicateur de taille global.
- **Fade Duration** : durée de fondu en entrée et en sortie.

---

### Animation

- **Emit Rate** : nombre de nouvelles lignes par seconde.
- **Speed** : vitesse de déplacement des lignes.
- **Ambient Speed Master** : multiplicateur de vitesse global.

---

### Modulations

- **Random Thickness** : applique une variation aléatoire à l'épaisseur de chaque ligne.
- **Random Speed** : applique une variation aléatoire à la vitesse de chaque ligne.
- **Thickness Range** : valeurs minimale et maximale pour l'épaisseur aléatoire.
- **Speed Range** : valeurs minimale et maximale pour la vitesse aléatoire.

---

### Overlay

Permet d'afficher une image statique par-dessus l'animation (logos, filigranes, éléments graphiques).

**Overlays prédéfinis**
- **Preset** : sélectionner parmi les images pré-configurées dans `assets/overlays/`.
- Les images sont encodées en Base64 et se chargent instantanément.

**Image personnalisée**
- **Load Custom Image** : importer un fichier PNG, JPG ou SVG.
- Sélectionner « -- Custom Image -- » dans le menu déroulant pour accéder directement au navigateur de fichiers.

**Contrôles d'apparence**
- **Show Overlay** : afficher / masquer l'overlay.
- **Scale** (10–200%) : redimensionner l'image.
- **Opacity** (0–100%) : niveau de transparence.
- **Position X / Y** (0–100%) : position de l'image à l'écran.
- **Clear Image** : supprimer l'overlay actuel.

Les overlays sont inclus dans les exports PNG et vidéo, avec l'échelle, l'opacité et la position définies.

**Créer de nouveaux préréglages**
1. Ouvrir `utilities/overlay-converter.html`.
2. Convertir les images au format JSON Base64.
3. Placer les fichiers JSON dans `assets/overlays/`.
4. Recharger l'application — les nouveaux préréglages apparaissent dans le menu.

---

## Export

### Image fixe

- **p** — PNG : inclut l'overlay si actif. Correction automatique pour écrans haute résolution.
- **s** — SVG vectoriel : compatible avec Illustrator, Inkscape, etc. N'inclut pas l'overlay.
- **d** — Carte de profondeur : blanc = proche, noir = lointain. Utile pour la post-production.

### Enregistrement vidéo

1. Définir **Duration** (durée en secondes).
2. Définir **Frame Rate** (30 FPS standard).
3. Appuyer sur **v** ou cliquer sur **Record Video**.
4. Ne pas interagir avec la page pendant l'enregistrement.
5. Le fichier se télécharge automatiquement à la fin.

L'overlay est composé sur chaque image de la vidéo.

---

## Opérations courantes

**Passer en plein écran** : touche Entrée.

**Masquer les contrôles** : touche Tab (utile avant une capture d'écran).

**Changer les couleurs** : cliquer sur un bouton de palette (1–4) ou utiliser les touches correspondantes, puis modifier les sélecteurs de couleur.

**Augmenter la densité** : augmenter le curseur **Emit Rate**.

**Réduire la densité** : diminuer le curseur **Emit Rate**.

**Modifier l'épaisseur des lignes** : ajuster le curseur **Line Thickness**.

**Modifier la vitesse** : ajuster les curseurs **Speed** ou **Ambient Speed Master**.

**Ajouter de la variété** : activer **Random Thickness** et **Random Speed**.

**Réinitialiser**
- Caméra : touche **r**
- Zoom : touche **0**
- Tous les paramètres : recharger la page (les paramètres sont conservés automatiquement dans le navigateur)

---

## Résolution et tailles de sortie

**Résolution fixe**
1. Cocher **Framebuffer Resolution**.
2. Sélectionner un préréglage : 1920×1080 (HD), 1080×1080 (carré), 3840×2160 (4K), 1080×1440 (Instagram portrait), etc.
3. Exporter normalement.

**Taille de fenêtre**
Laisser **Framebuffer Resolution** décoché. Le rendu s'adapte à la taille de la fenêtre du navigateur.

---

## Paramètres recommandés

**Pour débuter**
- Emit Rate : 1.5 — Speed : 80 — Line Thickness : 12
- Modulations aléatoires désactivées

**Pour une animation fluide**
- Réduire le taux d'émission — fermer les autres onglets du navigateur

**Pour un effet dramatique**
- Field of View élevé (90°–120°) — Random Speed et Random Thickness activés

**Pour un rendu épuré**
- Emit Rate faible (0.5–1.0) — Speed élevée (150–300) — modulations désactivées

---

## Dépannage

| Problème | Solution |
|----------|---------|
| Rien n'apparaît | Recharger la page ; vérifier que Emit Rate > 0 |
| Animation trop dense | Réduire le curseur Emit Rate |
| Animation trop lente | Augmenter le curseur Speed |
| Les lignes disparaissent | Elles sont hors du champ de vue |
| Impossible de faire pivoter la caméra | Placer le curseur sur la zone d'animation, pas sur le panneau |
| La vidéo ne se télécharge pas | Patienter — les fichiers volumineux prennent du temps |
| Impossible de quitter le plein écran | Appuyer sur Échap |

---

## Fichiers du projet

- `index.html` — application principale
- `User-Manual-fr.md` — ce document
- `README-fr.md` — présentation des fonctionnalités
- `Documentation-fr.md` — documentation technique
- Fichiers `.json` — projets sauvegardés

Les paramètres sont automatiquement conservés dans le navigateur entre les sessions.
