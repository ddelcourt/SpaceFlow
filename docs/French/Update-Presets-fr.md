# Mise à Jour de la Liste des Presets

```mermaid
flowchart TD
    Start["Exécuter ./scripts/welcome-updater"] --> Scan["Scanner presets/ pour fichiers .json"]
    
    Scan --> Generate["Générer presets/manifest.json"]
    
    Generate --> Update["Mettre à jour welcome.html<br/>(entre commentaires marqueurs)"]
    
    Update --> Sort["Trier presets:<br/>1. Fichiers init d'abord<br/>2. Puis alphabétiquement"]
    
    Sort --> Links["Générer liens Éditeur + Lecteur<br/>pour chaque preset"]
    
    Links --> Done["✅ Terminé!<br/>Cliquer 'Refresh' sur page d'accueil"]
    
    style Start fill:#2d3748,stroke:#4299e1,color:#fff
    style Generate fill:#2c5282,stroke:#90cdf4,color:#fff
    style Done fill:#22543d,stroke:#68d391,color:#fff
```

## Utilisation

Exécutez le script pour mettre à jour automatiquement la page d'accueil avec tous les presets trouvés dans `presets/` :

```bash
./scripts/welcome-updater
```

## Fonction

Le script :
- Scanne le répertoire `presets/` pour les fichiers `.json`
- Génère `presets/manifest.json` avec les métadonnées des presets
- Met à jour `welcome.html` entre les commentaires marqueurs
- Trie les presets avec les fichiers init en premier, puis alphabétiquement
- Génère des liens Éditeur et Lecteur pour chaque preset

## Ajouter de Nouveaux Presets

1. Sauvegardez votre fichier preset dans `presets/filename.json`
2. Exécutez `./scripts/welcome-updater`
3. Cliquez sur le bouton "Refresh" sur la page d'accueil (ou rechargez la page)

## Chargement Dynamique

La page d'accueil inclut un bouton **Refresh** qui recharge la liste des presets depuis `manifest.json` sans nécessiter un rechargement de page.

**Flux de travail :**
1. Ajoutez le fichier preset dans `presets/`
2. Exécutez `./scripts/welcome-updater` (génère le manifest)
3. Cliquez sur le bouton "Refresh" sur la page d'accueil

## Marqueurs

Ne supprimez pas ces commentaires HTML de `welcome.html` :
```html
<!-- PRESETS_START -->
<!-- PRESETS_END -->
```

Le script remplace tout le contenu entre ces marqueurs.

---

Voir [scripts/README.md](scripts/README.md) pour tous les scripts disponibles.
