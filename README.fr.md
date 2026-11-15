# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · **Français** · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.15.1-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Un userscript qui améliore GitHub avec un panneau de réglages complet, une
galerie d'images pour le markdown rendu, des icônes de fichiers colorées partout
où GitHub liste des fichiers, des couleurs d'âge façon blame pour ces fichiers,
la taille des fichiers avec téléchargement en un clic, un menu contextuel pour
les actions sur les fichiers et un aperçu rapide de tout fichier.

> **Statut :** début (`0.15.1`). Panneau de réglages avec recherche instantanée
> (Général · Galerie · Fichiers · Sauvegarde · À propos), la galerie d'images du
> markdown, des icônes de fichiers colorées, des couleurs d'âge façon blame, la
> taille des fichiers avec boutons de téléchargement, un menu contextuel de
> fichiers et un aperçu rapide des fichiers. D'autres améliorations de GitHub
> sont prévues.

> Les `@updateURL` / `@downloadURL` du script pointent vers `main` sur GitHub —
> l'URL d'installation ci-dessous mène toujours à la version la plus récente.

## Installation rapide

1. Installez un gestionnaire de userscripts ([Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) ou
   [ScriptCat](https://scriptcat.org/) recommandé).
2. Installez le script depuis GitHub (URL brute ci-dessous).

**URL d'installation (GitHub — la plus récente) :**

```
https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js
```

[![Install](https://img.shields.io/badge/Install-GitHub_raw-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)

### Installation depuis une URL (tableau de bord)

| Gestionnaire | Chemin |
|---------|------|
| Tampermonkey | Tableau de bord → **Utilities** → **Install from URL** |
| Violentmonkey | Tableau de bord → **+** → **Install from URL** |
| Greasemonkey | Menu de l'extension → **New User Script** → collez l'URL brute |
| ScriptCat | Installez l'[extension](https://scriptcat.org/), puis **Install from URL** avec l'URL brute GitHub |

### Installation manuelle

1. Ouvrez le fichier [`github-plus.user.js`](https://github.com/NemoKing1210/github-plus/blob/main/github-plus.user.js) compilé dans ce dépôt (ou lancez `npm run build` après le clonage).
2. Copiez tout le contenu du fichier.
3. Dans votre gestionnaire de userscripts, créez un nouveau script et collez le code.
4. Enregistrez et activez le script.

## Mises à jour

Le script contient les métadonnées `@updateURL` et `@downloadURL` qui pointent
vers le fichier brut sur GitHub ; les gestionnaires compatibles le mettent donc à
jour automatiquement.

Étapes de publication pour les mainteneurs : voir
[docs/DEVELOPMENT.md § Releasing](docs/DEVELOPMENT.md#releasing).

## Fonctionnalités

### Galerie d'images pour le markdown

Chaque conteneur de markdown rendu sur GitHub forme un ensemble de galerie :

- **Cliquez sur n'importe quelle image** — dans le README d'un dépôt, la vue d'un
  fichier `.md`, une page wiki, un ticket, une pull request, un commentaire de
  revue (partout où GitHub rend `.markdown-body`) — et elle s'ouvre en plein
  écran dans la visionneuse intégrée.
- **Parcourez tout l'ensemble** — `←`/`→` (ou les flèches) passent aux autres
  images du même conteneur, la bande de vignettes centrée permet d'aller
  n'importe où et le compteur indique votre position.
- **Zoom et déplacement** — molette, `+`/`−`, double-clic et pincement zooment
  jusqu'à la limite configurée ; faites glisser pour déplacer l'image à n'importe
  quel zoom ; `0` réinitialise, `r` fait pivoter ; les images voisines sont
  préchargées pour que la navigation soit instantanée.
- **Taille réelle à la demande** — lorsqu'une image pointe vers un fichier plus
  grand (un fichier du dépôt derrière une page `/blob/`, une pièce jointe
  téléversée, n'importe quelle URL d'image), ce fichier est testé puis
  substitué : vous obtenez la résolution d'origine sans image cassée s'il est
  indisponible.
- **Téléchargez ce que vous voyez** — survolez une image Markdown pour faire
  apparaître un bouton de téléchargement, et la visionneuse a le sien ; le
  fichier est enregistré sous son propre nom (une adresse de proxy est
  déballée jusqu’au nom d’origine), et un réglage masque les deux boutons.
- **Discret par défaut** — les badges, extraits de statut, emojis et petites
  icônes n'occupent jamais une place dans la galerie ; les images gardent
  l'apparence de GitHub (seul le curseur indique qu'elles ouvrent la galerie),
  et les clics avec modificateur (Ctrl/Cmd/Shift/Alt) ou au bouton du milieu
  restent à GitHub : ouvrir un fichier dans un nouvel onglet fonctionne
  exactement comme avant.
- **Adapté au thème** — la galerie et le panneau de réglages utilisent les
  variables de couleur de GitHub et suivent donc le thème choisi (clair, sombre,
  atténué).

### Icônes de fichiers

GitHub dessine chaque fichier et dossier avec le même glyphe gris : `.ts` et
`.css` se ressemblent jusqu'à ce qu'on lise le nom. GitHub Plus les colore :

- **Type par extension** — langages, formats de configuration et de données,
  images, médias, archives et documents ont leur propre icône ; les extensions
  composées comme `.d.ts` et `.spec.ts` sont testées avant l'extension de base.
- **Noms connus** — `Dockerfile`, `package.json`, `README`, `.gitignore`,
  `tsconfig.json` et leurs semblables ont une icône dédiée.
- **Rôle des dossiers** — `src`, `dist`, `node_modules`, `docs`, `.github`,
  `components`, `utils` et d'autres dossiers courants sont aussi marqués.
- **Partout où GitHub liste des fichiers** — l'arborescence du dépôt et ses
  sous-dossiers, la barre latérale de l'arborescence sur les pages de code,
  l'en-tête de fichier des pages blob, tree et blame, les en-têtes de fichiers
  des pull requests et l'arbre du diff, les listes de fichiers de commits, la
  recherche de code, les gists et les assets de release.
- **Discret** — le glyphe natif de GitHub est masqué et remplacé sur place ;
  aucun changement de mise en page, aucune bordure supplémentaire, et désactiver
  la fonction restaure GitHub à l'identique.

Les icônes sont un sous-ensemble sélectionné de
[Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)
(MIT) ; l'attribution figure dans [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

### Âge des fichiers

GitHub indique déjà depuis combien de temps chaque fichier a changé, mais toutes
les dates se ressemblent au premier coup d’œil. GitHub Plus emprunte la légende
de blame et colore le texte de la date lui-même :

- **Un coup d’œil, un âge** — les dates les plus récentes sont chaudes
  (`#ffd78d` dans le thème sombre, l’or d’attention dans le clair) et les plus
  anciennes s’estompent vers le gris atténué du thème : un fichier de quatre
  mois paraît donc déjà ancien. L’échelle est volontairement concentrée sur le
  présent : jours, semaines et mois restent distincts, tout ce qui dépasse un an
  est gris. Les thèmes clair et sombre ont chacun leur dégradé, pour que la
  couleur reste forte et lisible dans les deux.
- **Rien ne bouge** — la date conserve le texte, la formulation relative et
  l’infobulle de GitHub ; seule sa couleur change, donc aucune ligne n’est
  redimensionnée et l’étiquette accessible reste exactement celle rendue par
  GitHub.
- **Fichiers et dossiers** — les lignes de dossiers sont aussi colorées (la date
  indique leur dernier changement) et un réglage limite la fonction aux fichiers.
- **Discret** — désactiver la fonction restaure la couleur de date de GitHub et
  ne laisse aucune trace.

### Tailles et téléchargements des fichiers

La liste d’un dépôt GitHub indique quand un fichier a changé, mais pas sa taille,
et pour l’enregistrer il faut d’abord l’ouvrir. GitHub Plus ajoute les deux
directement aux lignes de fichiers :

- **La taille en un coup d’œil** — chaque fichier d’une liste de dépôt reçoit une
  taille discrète dans sa propre colonne. Les tailles ne sont demandées que pour
  les lignes proches de la zone visible, mises en cache pour la session, et un
  fichier dont la taille est illisible n’en affiche simplement pas.
- **Télécharger sur place** — chaque ligne de fichier affiche sa taille au bord
  gauche de la colonne et, au bord droit, un bouton de téléchargement au style
  des boutons d’icône de GitHub. Le fichier est enregistré sous son propre nom ;
  la route raw de même origine préserve les dépôts privés, et un accès bloqué
  ouvre le fichier dans un nouvel onglet. La vue blob de GitHub affiche déjà la
  taille et son propre bouton : elle reste intacte.
- **Aucun quota d’API** — les tailles proviennent d’une requête HEAD sur
  l’adresse raw du fichier, pas de l’API GitHub : la limite anonyme de 60
  requêtes par heure reste intacte.
- **Discret** — les dossiers gardent une cellule vide, et désactiver la fonction
  retire chaque taille, chaque bouton et chaque cellule, laissant GitHub tel
  quel.

### Menu contextuel des fichiers

Un clic droit sur un fichier est le chemin le plus court vers ce que vous voulez
en faire — et le menu de GitHub n'offre rien de tout cela. GitHub Plus le
remplace pour les fichiers :

- **Actions rapides** — un clic droit sur un fichier d'une liste de dépôt ou de
  la barre latérale de l'arborescence ouvre **Ouvrir**, **Ouvrir dans un nouvel
  onglet**, **Télécharger**, **Copier le contenu**, **Copier le lien** et
  **Copier le chemin**. Sur la page d'un fichier ou de blame, le même menu
  apparaît (sans **Ouvrir**, puisque vous y êtes déjà).
- **Copier le contenu** — le contenu d'un fichier texte part directement dans le
  presse-papiers sans ouvrir la page ; les fichiers binaires et tout ce qui
  dépasse 1 Mio sont refusés par un message clair, plutôt que de coller des
  déchets ou de figer l'onglet.
- **Copier le chemin** — le chemin relatif au dépôt (`src/main.js`), prêt à
  coller dans un terminal, un import ou un lien.
- **Seulement là où c'est utile** — le menu natif reste intact pour les
  dossiers, les images, les médias et les liens ordinaires ; un clic droit qui
  ne vise pas un fichier se comporte comme avant.
- **Au clavier aussi** — la touche du menu contextuel ouvre le même menu sur le
  lien du fichier, avec navigation aux flèches et retour du focus à la
  fermeture ; désactiver la fonction rétablit le menu du navigateur partout.

### Aperçu rapide des fichiers

Ouvrez n'importe quel fichier sans quitter la page — avec le bouton œil d'une
liste de fichiers ou **Aperçu** dans le menu contextuel du fichier :

- **Rendu, pas brut** — le markdown est rendu et assaini, les fichiers source
  reçoivent la coloration syntaxique et des numéros de ligne, les images, la
  vidéo et l'audio se lisent sur place, et les PDF s'ouvrent dans la visionneuse
  du navigateur lorsque la politique de la page GitHub autorise le cadre. Tout
  le reste — y compris un PDF que la page bloque — affiche une carte honnête
  avec **Ouvrir sur GitHub** et **Télécharger** au lieu d'un cadre cassé.
- **Parcourir le dossier** — les fichiers d'un même dossier forment un ensemble :
  les boutons précédent/suivant et les flèches du clavier passent de l'un à
  l'autre, la position actuelle étant indiquée en pied.
- **Aperçu par appui long** — maintenez le bouton gauche de la souris sur le nom
  d'un fichier dans une liste pour ouvrir son aperçu ; un clic rapide ouvre
  toujours le fichier, et un glissement ou une sélection de texte annule.
- **Actions dans l'en-tête** — ouvrir le fichier sur GitHub, copier son contenu
  brut, son lien ou son chemin, ou le télécharger sous son propre nom.
- **Markdown : aperçu ou source** — un contrôle segmenté bascule entre le
  markdown rendu et son texte d'origine, coloré comme du markdown.
- **Sûr avec les dépôts privés** — les images et liens relatifs passent par la
  route raw de même origine, donc un README privé garde ses images ; le markdown
  est assaini et les images externes se chargent sans referrer.
- **Des limites honnêtes** — texte et markdown jusqu'à 2 Mio, PDF jusqu'à
  25 Mio, et la coloration est plafonnée pour qu'un fichier énorme ne fige pas
  l'onglet ; au-delà, la carte renvoie vers GitHub et le fichier brut.

### Panneau de réglages

Ouvrez-le depuis le bouton en forme d'engrenage de l'en-tête GitHub, la ligne
**Paramètres GitHub Plus** du menu de l'avatar (juste sous **Settings** de
GitHub) ou la commande de menu du gestionnaire de userscripts. Les modifications
sont un brouillon : rien n'est enregistré tant que vous n'avez pas cliqué sur
**Enregistrer** ; **Annuler**, le clic sur l'arrière-plan et `Échap` écartent le
brouillon ; **Réinitialiser** demande d'abord confirmation.

## Réglages

Stockés sous `gp_settings_v1`.

| Clé | Par défaut | Remarques |
|-----|---------|------|
| `language` | `'auto'` | Langue de l'interface du panneau de réglages (`'auto'` suit le navigateur) |
| `gallery.enabled` | `true` | Interrupteur principal de la galerie d'images du markdown |
| `gallery.sources.markdown` | `true` | Interrupteur par source (une entrée par source enregistrée) |
| `gallery.skipBadges` | `true` | Ignore les services de badges (y compris ceux derrière le proxy camo de GitHub et les badges de statut Actions), les emojis, les images de ≤ 40 px de haut et celles de moins de 80 px sur les deux axes |
| `gallery.upgradeFullSize` | `true` | Teste et charge l'original lié en taille réelle |
| `gallery.download` | `true` | Bouton de téléchargement dans la visionneuse et au survol des images Markdown |
| `gallery.thumbnails` | `true` | Bande de vignettes dans la visionneuse |
| `gallery.loop` | `true` | Passe de la dernière image à la première |
| `gallery.maxZoom` | `8` | Plafond de zoom (2× … 16×) |
| `toasts.enabled` | `true` | Notifications toast |
| `toasts.position` | `'bottom-right'` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `toasts.duration` | `5000` | Délai de masquage en ms (`0` garde le toast jusqu'à sa fermeture) |
| `fileIcons.enabled` | `true` | Interrupteur principal des icônes de fichiers et de dossiers |
| `fileIcons.folders` | `true` | Icônes propres aux noms de dossiers courants |
| `fileIcons.specialNames` | `true` | Icônes dédiées aux noms de fichiers connus |
| `fileAges.enabled` | `true` | Interrupteur principal ; couleurs d’âge façon blame pour les fichiers listés |
| `fileAges.folders` | `true` | Colorer aussi les lignes de dossiers |
| `fileMeta.enabled` | `true` | Interrupteur principal des tailles et boutons de téléchargement |
| `fileMeta.sizes` | `true` | Afficher la taille de chaque fichier dans les listes du dépôt |
| `fileMeta.download` | `true` | Bouton de téléchargement dans les listes du dépôt |
| `fileMenu.enabled` | `true` | Interrupteur principal du menu contextuel des fichiers |
| `filePreview.enabled` | `true` | Interrupteur principal de l'aperçu rapide des fichiers |
| `filePreview.rowButton` | `true` | Bouton œil dans les lignes des listes de fichiers (le menu contextuel propose toujours **Aperçu**) |
| `filePreview.longPress` | `true` | Maintenir le bouton gauche sur le nom d'un fichier de la liste pour ouvrir l'aperçu |

## Comment la galerie est construite

La galerie est un petit framework plus une source par endroit où vivent des
images ; ajouter un endroit ne touche donc jamais la galerie :

| Fichier | Rôle |
|------|------|
| `src/ui/viewer.js` | La lightbox : `openViewer({ images, index, loop, thumbnails, download, minZoom, maxZoom, resolveImage, labels, onClose })`, plus `closeViewer()` / `isViewerOpen()`. Autonome — réutilisable par n'importe quelle fonctionnalité. |
| `src/gallery/sources.js` | Registre des sources : `registerSource`, `listSources`. |
| `src/gallery/collect.js` | Collecte : normalisation, filtrage (badges/emojis/petites icônes), déduplication, plafond. |
| `src/gallery/index.js` | Câblage : un écouteur de clics en phase de capture, la feuille de styles du curseur générée, des écouteurs de survol délégués pour le bouton de téléchargement, l'écouteur de réglages. |
| `src/gallery/sources/markdown.js` | La source markdown : conteneurs, recherche d'images, résolution de la taille réelle. |

Comme l'affordance est du CSS construit depuis le registre et que la gestion des
clics est un unique écouteur délégué qui parcourt le DOM vivant, la galerie
continue de fonctionner après la navigation côté client de GitHub et les
re-rendus React, sans boucle de scan ni suivi image par image.

### Ajouter une source

```js
import { registerSource } from '../sources.js';

registerSource({
  id: 'mySurface',            // also the settings switch key (gallery.sources.mySurface)
  labelKey: 'source.mySurface',
  hintKey: 'source.mySurfaceDesc',
  containerSelector: '.my-surface',   // one container = one gallery set
  cursorSelector: '.my-surface img',  // gets cursor: zoom-in while enabled
  collect(container) {
    // return [{ node, src, alt?, title?, href? }]
  },
  resolveFull(item) {
    // return the best full-size URL for item, or '' when unknown
  },
});
```

Ajoutez ensuite les interrupteurs à quatre endroits à la fois : le module de la
source et son import, `DEFAULT_GALLERY.sources.<id>` dans `src/core/constants.js`,
et les clés `source.<id>` / `source.<id>Desc` dans **les dix** fichiers
`src/i18n/locales/*.js`. Le panneau de réglages reprend la nouvelle source depuis
le registre automatiquement.

## Développement

Nécessite Node.js 22 (voir `.nvmrc`).

```bash
npm install
npm run dev                # vite-plugin-monkey dev server (dev: prefix)
npm run build              # vite build + copy dist/ → root artifacts
npm run verify:artifacts   # fail if dist/ and root artifacts differ
npm run ci                 # build + verify (CI gate)
npm run icons:build        # regenerate the embedded icon subset
npm test                   # Node test runner (unit tests)
```

Modifiez uniquement les fichiers sous `src/` — `github-plus.user.js` et
`github-plus.meta.js` sont générés. Voir [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
pour les tests et le débogage, [CONTRIBUTING.md](CONTRIBUTING.md) pour les
règles, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour la carte des modules et
les flux de données, et [DESIGN.md](DESIGN.md) avant de toucher au moindre
élément visible.

## Licence

[MIT](LICENSE).

Les icônes de fichiers embarquées proviennent de Material Icon Theme (MIT) ;
voir [THIRD_PARTY_LICENSES](THIRD_PARTY_LICENSES).

Un projet indépendant, non affilié à GitHub, Inc.
