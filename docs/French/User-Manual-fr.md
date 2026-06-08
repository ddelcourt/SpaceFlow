# SpaceFlow — Manuel utilisateur

```mermaid
graph TB
    Start["Ouvrir index.html"] --> UI["Interface Charge"]
    
    UI --> Controls["Panneau Gauche:<br/>Projet, États, Paramètres"]
    UI --> Canvas["Canvas:<br/>Visualisation 3D"]
    
    Canvas --> Mouse["Contrôles Souris:<br/>Orbite, Déplacement, Zoom"]
    Canvas --> Keys["Raccourcis Clavier:<br/>Tab, Entrée, P, S, R, 1-4"]
    
    Controls --> Project["Sauvegarder/Charger Projets"]
    Controls --> States["Gérer États<br/>(Save, Update, Delete)"]
    Controls --> Params["Ajuster Paramètres<br/>(Géométrie, Couleur, Animation)"]
    
    States --> Auto["Déclenchement Auto:<br/>Lecture automatique états"]
    
    Params --> Export["Export:<br/>PNG, SVG, Vidéo, Profondeur"]
    
    style Start fill:#2d3748,stroke:#4299e1,color:#fff
    style Canvas fill:#2c5282,stroke:#90cdf4,color:#fff
    style Export fill:#22543d,stroke:#68d391,color:#fff
```

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
| Faire pivoter la vue (orbite) | Clic gauche + glisser |
| Déplacer la vue (décalage 2D) | Clic droit + glisser |
| Rotation Z (roulis de la scène) | Clic molette + glisser horizontalement |
| Zoom | Molette |

Les contrôles souris sont actifs uniquement lorsque le curseur se trouve sur la zone d'animation, pas sur le panneau de contrôle.

**Détails des contrôles :**
- **Orbite** (clic gauche) : Fait pivoter la caméra autour du centre de la scène sur les axes X/Y
- **Déplacement** (clic droit) : Déplace la vue de la caméra en 2D sans changer l'angle d'orbite  
- **Rotation Z** (clic molette) : Fait pivoter toute la scène autour de l'axe Z
- **Zoom** (molette) : Change la distance de la caméra par rapport au centre de la scène

---

## Raccourcis clavier

| Touche | Action |
|--------|--------|
| Tab | Masquer / afficher le panneau de contrôle |
| Entrée | Plein écran |
| P | Exporter PNG (inclut l'overlay) |
| S | Exporter SVG (vectoriel uniquement) |
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
- **Renommer** : double-cliquer sur le nom d'un état pour le modifier (ou utiliser le bouton renommer ✎).
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
- **Color Random Seed** (1-9999) : graine pour sélection déterministe des couleurs. Toutes les fenêtres avec la même graine sélectionneront des couleurs identiques pour les nouvelles lignes, assurant la synchronisation parfaite entre la fenêtre principale et les fenêtres d'affichage.

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

### Fenêtre d'affichage

Pour les présentations multi-écrans et les installations, le bouton **Ouvrir Fenêtre d'Affichage** (dans la section Projet) ouvre des fenêtres d'affichage secondaires synchronisées. Vous pouvez ouvrir plusieurs fenêtres d'affichage—chacune reçoit un ID unique (display-1, display-2, display-3, etc.).

**Stratégie de synchronisation duale :**

1. **Transitions d'états** (efficace) : Lors du chargement d'états ou de la modification de paramètres via l'interface, une seule commande de transition est diffusée. Les fenêtres d'affichage exécutent la même transition fluide localement. Résultat : Synchronisation parfaite avec une bande passante minimale.

2. **Contrôle manuel de la caméra** (temps réel) : Pendant l'interaction de la souris (orbite, déplacement, zoom, rotation Z), les positions de la caméra sont diffusées à 60 images par seconde pour un suivi réactif en temps réel.

**Fonctionnement :**
La fenêtre principale diffuse les changements de paramètres et les commandes aux fenêtres d'affichage en temps réel. Chaque fenêtre exécute son propre code génératif indépendant en utilisant les mêmes paramètres, créant des animations similaires mais non identiques.

**Pourquoi les affichages diffèrent légèrement :**
Les images sur les affichages principal et secondaire seront **visuellement similaires mais non identiques au pixel près**. C'est normal et attendu :

- **Synchronisation de paramètres** : Le système synchronise les paramètres d'état (couleurs, caméra, géométrie, etc.), pas les pixels réels
- **Génération indépendante** : Chaque fenêtre génère son animation de manière indépendante en utilisant les mêmes règles mais des graines aléatoires différentes
- **Variations de temporisation** : Les cycles de rendu du navigateur diffèrent légèrement entre les fenêtres

**Avantages par rapport à la diffusion d'images :**
- Bande passante beaucoup plus faible (paramètres vs. trames vidéo)
- Rendu GPU natif sur chaque affichage maintenant 60 images par seconde fluides
- Chaque affichage fonctionne à sa résolution optimale de manière indépendante
- Plusieurs affichages peuvent se connecter sans dégradation des performances
- Aucun artefact de compression vidéo
- Synchronisation intelligente : commandes de transition pour des animations fluides, mises à jour en temps réel pour le contrôle manuel

**Contrôle clavier bidirectionnel**

Les fenêtres d'affichage prennent en charge le **contrôle clavier à distance**, vous permettant de piloter l'ensemble du système depuis n'importe quelle fenêtre d'affichage. Ceci est particulièrement utile pour les performances en direct où vous regardez la sortie du projecteur plutôt que la fenêtre de contrôle.

**Touches prises en charge depuis les fenêtres d'affichage :**
- **Flèches directionnelles** (← →) : Naviguer dans l'historique des états (état précédent/suivant)
- **Barre d'espace** : Lecture/pause du déclenchement automatique
- **Touches numériques** (1–4) : Sélectionner les palettes de couleurs
- **Touches d'export** : P (PNG), S (SVG), D (Profondeur), V (Vidéo), Ctrl+S/⌘+S (Sauvegarder projet)
- **Touches caméra** : R (Réinitialiser caméra), 0 (Réinitialiser zoom)

**Touches locales uniquement (non transférées) :**
- **Entrée / F / f** : Basculer plein écran (chaque fenêtre contrôle son propre état plein écran)
- **Tab** : Basculer la visibilité du panneau de contrôle (fenêtre principale uniquement)
- **y** : Basculer le mode stéréoscopique (fenêtre principale uniquement)

**Flux de commande :**
1. Appuyez sur une touche dans n'importe quelle fenêtre d'affichage
2. La commande est transmise à la fenêtre principale
3. La fenêtre principale exécute l'action
4. La fenêtre principale diffuse le résultat à tous les affichages
5. Tous les affichages (y compris l'expéditeur) se synchronisent avec le nouvel état

La fenêtre principale reste toujours la source unique de vérité, garantissant un comportement cohérent et prévisible sur tous les affichages.

Cette approche est idéale pour les installations en direct et les configurations multi-projecteurs nécessitant des animations synchronisées de haute qualité.

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
