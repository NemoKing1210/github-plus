# GitHub Plus

[English](README.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Español](README.es.md) · **Français** · [Português (Brasil)](README.pt-BR.md) · [中文（简体）](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![CI](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/github-plus/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/Install-userscript-1f6feb?style=for-the-badge&labelColor=0d1117)](https://raw.githubusercontent.com/NemoKing1210/github-plus/main/github-plus.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.33.1-green?style=for-the-badge)](https://github.com/NemoKing1210/github-plus/blob/main/CHANGELOG.md)

Un userscript qui améliore GitHub avec un panneau de réglages complet, une
palette de commandes avec `Ctrl/⌘+K`, une galerie d'images pour le markdown
rendu, des icônes de fichiers colorées partout où GitHub liste des fichiers, des
couleurs d'âge façon blame pour ces fichiers, des dossiers dépliables dans la
liste du dépôt, la taille des fichiers avec
téléchargement en un clic, un menu contextuel pour les actions sur les fichiers et
dossiers,
un aperçu rapide de tout fichier, des badges Conventional Commits et la
traduction du contenu des pages.

> **Statut :** début (`0.33.1`). Panneau de réglages avec recherche instantanée
> (Général · Galerie · Fichiers · Commits · Traduction · Palette · Découverte · Sauvegarde ·
> À propos), une palette de commandes avec `Ctrl/⌘+K`, la galerie d'images du
> markdown, des icônes de fichiers colorées, des couleurs d'âge façon blame, la
> taille des fichiers avec boutons de téléchargement, des dossiers dépliables,
> un menu contextuel de
> fichiers et dossiers, un aperçu rapide des fichiers, des badges de commit et la traduction
> des pages. D'autres améliorations de GitHub sont prévues.

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
  revue (partout où GitHub rend `.markdown-body`) ou dans le markdown rendu de
  l'aperçu rapide — et elle s'ouvre en plein écran dans la visionneuse intégrée.
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

### Dossiers dépliables

Une liste de dépôt n'affiche qu'un niveau à la fois : suivre un chemin coûte un
chargement de page par dossier. GitHub Plus transforme la liste en
arborescence :

- **Un clic pour regarder à l'intérieur** — chaque ligne de dossier commence par
  un chevron ; le contenu du dossier apparaît juste en dessous sous forme de
  lignes ordinaires, indentées d'un cran par niveau, et le même chevron les
  replie. Les dossiers imbriqués se déplient de la même façon, aussi profondément
  que voulu.
- **Le nom du dossier navigue toujours** — seul le chevron déplie ; un clic
  simple sur le nom ouvre le dossier comme avant. Le chevron est un vrai bouton
  (`aria-expanded`, un libellé par dossier) utilisable au clavier.
- **Tout le reste continue de fonctionner** — les lignes imbriquées reprennent la
  forme des lignes de GitHub, donc les icônes de fichiers, les couleurs d'âge
  façon blame, les tailles, les boutons de téléchargement, l'aperçu rapide
  (précédent/suivant restant dans le dossier) et le menu contextuel s'y
  appliquent sans rien changer.
- **Dates et messages compris** — chaque ligne imbriquée affiche le message du
  dernier commit et la couleur d'âge, lus depuis la même session que la page :
  les dépôts privés fonctionnent et aucun jeton d'API n'est dépensé.
- **Des limites honnêtes** — un dossier vide le dit, un dossier de plus de 1000
  entrées affiche les 1000 premières avec une note, et une requête échouée laisse
  le dossier replié avec un toast plutôt qu'une arborescence à moitié rendue.
- **Discret** — désactiver la fonction retire tous les chevrons et lignes
  imbriquées et laisse GitHub tel quel ; après une navigation, tous les dossiers
  sont repliés.

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

### Menu contextuel des fichiers et dossiers

Un clic droit sur un fichier ou un dossier est le chemin le plus court vers ce
que vous voulez en faire — et le menu de GitHub n'offre rien de tout cela.
GitHub Plus le remplace pour les fichiers et les dossiers :

- **Actions rapides** — un clic droit sur un fichier d'une liste de dépôt, de
  la barre latérale de l'arborescence ou sur un lien vers un fichier dans du
  markdown rendu ouvre **Ouvrir**, **Ouvrir dans un nouvel
  onglet**, **Télécharger**, **Copier le contenu**, **Copier le lien**,
  **Copier le chemin** et **Copier le nom**. Sur la page d'un fichier ou de
  blame, le même menu apparaît (sans **Ouvrir**, puisque vous y êtes déjà).
- **Les dossiers aussi** — un dossier de la liste, de l'arborescence latérale ou
  un lien vers un dossier dans du markdown rendu a son propre menu court :
  **Ouvrir**, **Ouvrir dans un nouvel onglet**, **Copier le lien**,
  **Copier le chemin** et **Copier le nom**. Un dossier n'a rien à télécharger
  ni à lire, donc ces actions n'y figurent pas.
- **Déplier depuis le menu** — pour un dossier de la liste du dépôt, le menu
  propose **Développer** ou **Réduire** : le même contrôle que le chevron de la
  ligne, sans avoir à le viser.
- **Copier le contenu** — le contenu d'un fichier texte part directement dans le
  presse-papiers sans ouvrir la page ; les fichiers binaires et tout ce qui
  dépasse 1 Mio sont refusés par un message clair, plutôt que de coller des
  déchets ou de figer l'onglet.
- **Copier le chemin** — le chemin relatif au dépôt (`src/main.js`), prêt à
  coller dans un terminal, un import ou un lien.
- **Copier le nom** — juste le nom de l'élément (`src`, `README.md`), pour un
  import, un message de commit ou une recherche.
- **Seulement là où c'est utile** — le menu natif reste intact pour les
  sous-modules, les images, les médias et les liens ordinaires (y compris les
  liens markdown qui ne visent aucun fichier du dépôt) ; un clic droit qui ne
  vise ni fichier ni dossier se comporte comme avant.
- **Au clavier aussi** — la touche du menu contextuel ouvre le même menu sur le
  lien du fichier, avec navigation aux flèches et retour du focus à la
  fermeture ; désactiver la fonction rétablit le menu du navigateur partout.

### Aperçu rapide des fichiers

Ouvrez n'importe quel fichier sans quitter la page — avec le bouton œil d'une
liste de fichiers, avec un lien vers un fichier dans du markdown rendu ou
**Aperçu** dans le menu contextuel du fichier :

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
  d'un fichier dans une liste ou sur un lien vers un fichier dans du markdown
  rendu (y compris dans l'aperçu déjà ouvert) pour ouvrir son aperçu ; la durée
  de l'appui (450 ms par défaut) et le cercle de progression près du pointeur
  sont configurables ; un clic rapide ouvre toujours le fichier, et un
  glissement ou une sélection de texte annule.
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

### Badges de commit

Les sujets Conventional Commits affichent leur préfixe `type(scope):` sous
forme d'une pastille unique sur la page :

- **Une pastille à deux tons** — le type dans un segment coloré et la portée
  dans un segment atténué, réunis dans un même contour arrondi, suivis de
  deux-points atténués : `fix(parser): handle empty input` se lit d'un coup
  d'œil sans changer un seul caractère du sujet.
- **Une couleur par type, honnête pour le reste** — `feat`, `fix`, `docs`,
  `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` et `revert` ont
  chacun la leur ; les autres types en minuscules reçoivent une couleur neutre
  (et peuvent rester sobres), et un préfixe `!` affiche un marqueur rouge de
  changement incompatible.
- **Partout où GitHub affiche un sujet** — l'historique des commits, l'onglet
  **Commits** d'une pull request, la page d'un commit isolé, le bloc du dernier
  commit sur l'accueil du dépôt et les vues de commits classiques. Le texte ne
  change pas : copier, rechercher et traduire fonctionnent comme avant, et
  désactiver la fonction restaure le rendu propre à GitHub.

### Traduction

Traduisez le texte d'une page sans perdre son balisage — un README, un ticket
ou une discussion, une pull request, un commentaire, des messages de commit, un
titre ou le fichier markdown ouvert dans l'aperçu rapide :

- **Un bouton là où se trouve le texte** — dans l'en-tête du README, la ligne
  d'actions d'un commentaire, un commit ou le titre d'un ticket. Si GitHub
  n'offre pas d'en-tête, une petite barre apparaît au-dessus du texte.
- **Le balisage survit** — liens, images, code en ligne, cases de tâches et
  emphases continuent de fonctionner : la traduction remplace des blocs de
  texte, jamais la structure qui les entoure.
- **Au clic ou automatiquement** — rien n'est envoyé tant que vous ne cliquez
  pas ; le mode automatique traduit un bloc dès qu'il devient visible et garde
  son bouton **Afficher l'original**.
- **Sur place ou en dessous** — remplacez la source ou affichez la traduction
  en dessous ; **Afficher l'original** restaure le texte exact, et la révélation
  au survol permet d'y jeter un œil tant que le pointeur ou le focus est dans le
  bloc.
- **Les fichiers texte aussi** — les fichiers de licence et de mention (LICENSE,
  COPYING) affichés comme du code reçoivent le même bouton ; la traduction
  apparaît sous le fichier et le code n'est jamais réécrit.
- **Six fournisseurs** — Google gratuit par défaut (sans clé, non officiel et
  limité en débit), ou DeepL, Microsoft, Yandex, un point de terminaison
  compatible OpenAI ou votre instance LibreTranslate. Le texte traduit est
  envoyé au fournisseur choisi ; les clés API restent dans ce navigateur, donc
  une sauvegarde des réglages les contient.
- **En cache** — une traduction est réutilisée pendant 24 heures par défaut
  (configurable ; 0 désactive le cache) et se vide depuis la page de réglages.

### Palette de commandes

Appuyez sur `Ctrl/⌘+K` sur n'importe quelle page GitHub pour ouvrir un unique
champ de recherche sur tout ce que vous y faites :

- **Commence là où vous êtes** — sur une page de dépôt, la palette s'ouvre avec
  ce dépôt déjà dans son chemin : la première liste est donc ses pages.
- **Descendez avec `Tab`** — le champ est un chemin (`owner / repo / dossier /
  requête`). Appuyez sur `Tab` sur une ligne de dépôt pour l'ajouter, puis à
  nouveau sur une ligne de dossier pour y entrer : la liste devient les fichiers
  de ce dossier, avec des chemins relatifs à l'endroit où vous êtes, et `Tab`
  continue aussi profond que l'arbre le permet. `→` et `←` font la même chose
  quand le champ est vide : vous parcourez le chemin sans quitter les flèches.
  `Retour arrière` retire le
  dernier niveau, `Ctrl/⌘+Retour arrière` vide le chemin et la requête, et un
  clic sur un segment du chemin abandonne tout ce qui se trouve en dessous.
- **Vos dépôts** — tous ceux que vous possédez, les vôtres d'abord, avec étoiles,
  langage, dernier push et visibilité sur la ligne. Tapez `@` pour ne chercher
  que des dépôts.
- **Dépôts mis en favori** — les projets auxquels vous revenez sans cesse ; ils
  suivent les vôtres et portent une étoile.
- **Fichiers du dépôt du chemin** — `/` affiche tous ses chemins ou une requête
  qui y correspond ; les lignes de dossier sont marquées et s'ouvrent comme
  niveau avec `Tab`, et un fichier s'ouvre sur GitHub à la révision que vous
  consultez.
- **Issues et pull requests ouvertes** — `#` affiche les issues et pull requests
  ouvertes du dépôt, marquées d'un badge issue ou pull request, avec l'auteur et
  la date de mise à jour ; cherchez par titre, numéro ou auteur. Appuyez sur
  `Tab` sur la ligne Issues ou Pull requests du dépôt pour ouvrir cette liste
  comme un niveau à part, sans taper `#`.
- **Recherche indulgente** — les requêtes ignorent la casse et les accents
  latins (`cafe` trouve `Café`), préfèrent les débuts et les mots entiers et se
  découpent aux espaces, chaque partie étant obligatoire.
- **Des pages comme lignes** — les pages du dépôt du chemin (Code, Issues, Pull
  requests, nouvelle issue, comparer les modifications, Actions, Projects,
  Discussions, Releases, Wiki, Security, Insights et Settings si vous le
  possédez) ou, à la racine, les pages de votre compte (profil, dépôts, étoiles,
  nouveau dépôt, notifications, gists, réglages GitHub, tableau de bord), chacune
  à une ligne ; une ligne de dépôt est annotée `Aller à`, et une ligne de
  recherche GitHub termine chaque requête : code dans le chemin, issues pour
  `#`, dépôts pour `@` et pour une requête libre hors d'un chemin.
- **Actions GitHub Plus** — ouvrez le panneau, activez ou désactivez ses fonctions
  ou rafraîchissez le cache ; `>` pour les commandes.
- **Favoris et récents** — épinglez ce que vous utilisez constamment (`Alt+P`) ;
  les lignes épinglées portent une étoile et passent en premier, dans la liste
  vide comme dans les résultats de recherche. Les lignes ouvertes récemment
  remontent à l'ouverture suivante, séparément pour chaque compte GitHub.
- **Actions sur chaque ligne** — un clic droit sur une ligne ou `Shift+F10`
  l'ouvre, l'ouvre dans un nouvel onglet, copie son lien, son chemin, son adresse
  de clonage ou son numéro d'issue, et l'épingle ou la détache.
- **Rapide et discrète** — la palette affiche instantanément la liste en cache,
  la rafraîchit en arrière-plan et conserve votre sélection. Les résultats sont
  mis en cache avec des ETags pour la session et entre les rechargements, la
  palette ne consomme donc pas de quota d'API ; sans jeton elle lit les données
  publiques et toutes les commandes fonctionnent quand même.
- **Jeton GitHub facultatif** — ajoutez-le sur la page de réglages de la palette
  pour voir les dépôts privés et des listes complètes (5 000 requêtes par heure
  au lieu de 60). Le jeton est vérifié avant usage, stocké uniquement dans ce
  navigateur, jamais écrit dans une sauvegarde et envoyé uniquement à
  `api.github.com` ; le cache appartient à chaque compte, changer de compte
  n'affiche donc jamais les dépôts d'un autre.
- **Le clavier d'abord** — `↑`/`↓` déplacent la sélection, `Enter` ouvre,
  `Ctrl/⌘+Enter` ouvre dans un nouvel onglet, `Tab` entre dans un dépôt, un
  dossier ou une liste d'issues, `←`/`→` parcourent le chemin, `Retour arrière` quitte un niveau du chemin, `Alt+P` épingle, `Ctrl/⌘+C` copie
  la ligne, `?` affiche toutes les touches et préfixes, et `Échap` ferme (l'aide
  d'abord) ; la palette reste discrète pendant la saisie dans un éditeur de
  commentaire ou de README et se ferme d'elle-même à la navigation. Le raccourci
  est un préréglage ou n'importe quelle combinaison enregistrée sur la page de
  réglages de la palette.

### Dépôts similaires

Chaque page de dépôt public gagne dans sa barre latérale une section **Dépôts
similaires** qui recommande des projets proches de celui que vous consultez :

- **Deux sources de données au choix** — **GitHub** (par défaut) cherche selon
  les thèmes et le langage principal du dépôt sur `api.github.com` et classe
  les résultats par thèmes communs, même langage et nombre d’étoiles comparable.
  **SimRepo** affiche des données de similarité précalculées ; c’est un tiers,
  donc le panneau lui envoie le nom du dépôt que vous ouvrez et ses pages
  suivantes exigent une étoile sur le projet SimRepo, ce que la carte de
  réglages indique clairement.
- **Une ligne qu’on juge d’un coup d’œil** — propriétaire/nom, la description,
  le langage principal avec sa couleur, les étoiles, les forks, une étiquette
  d’archivage et un pourcentage de correspondance relatif ; la meilleure
  correspondance de l’ensemble s’affiche à 100 %.
- **Pagination** — **Voir plus** ajoute les résultats suivants quand la source
  en a.
- **Des états honnêtes** — chargement, aucun résultat, un dépôt absent du jeu de
  données, une limite de requêtes atteinte avec son heure de réinitialisation et
  une requête échouée ont chacun leur ligne, si bien que la barre latérale
  n’affiche jamais une boîte vide.
- **Publics uniquement** — le panneau n’est demandé que sur un dépôt que GitHub
  marque comme public ; un dépôt privé, interne ou de visibilité inconnue
  n’envoie jamais de requête, et le panneau n’y apparaît pas.
- **Vos réglages** — l’interrupteur principal, la source de données, les
  résultats par page et la durée de vie du cache sont sur la page **Découverte**.

### Panneau de réglages

Ouvrez-le depuis la ligne **Paramètres GitHub Plus** du menu de l'avatar (juste
sous **Settings** de GitHub), depuis la commande de paramètres de la palette ou
depuis la commande de menu du gestionnaire de userscripts. Les modifications
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
| `logging.enabled` | `false` | Diagnostic dans la console avec codes GP, module, détails et pile ; désactivé par défaut |
| `fileIcons.enabled` | `true` | Interrupteur principal des icônes de fichiers et de dossiers |
| `fileIcons.folders` | `true` | Icônes propres aux noms de dossiers courants |
| `fileIcons.specialNames` | `true` | Icônes dédiées aux noms de fichiers connus |
| `fileAges.enabled` | `true` | Interrupteur principal ; couleurs d’âge façon blame pour les fichiers listés |
| `fileAges.folders` | `true` | Colorer aussi les lignes de dossiers |
| `fileMeta.enabled` | `true` | Interrupteur principal des tailles et boutons de téléchargement |
| `fileMeta.sizes` | `true` | Afficher la taille de chaque fichier dans les listes du dépôt |
| `fileMeta.download` | `true` | Bouton de téléchargement dans les listes du dépôt |
| `fileMenu.enabled` | `true` | Interrupteur principal du menu contextuel des fichiers et dossiers |
| `filePreview.enabled` | `true` | Interrupteur principal de l'aperçu rapide des fichiers |
| `filePreview.rowButton` | `true` | Bouton œil dans les lignes des listes de fichiers (le menu contextuel propose toujours **Aperçu**) |
| `filePreview.longPress` | `true` | Maintenir le bouton gauche sur un nom de fichier ou un lien markdown pour ouvrir l'aperçu |
| `filePreview.longPressMs` | `450` | Durée de l'appui en ms avant l'ouverture de l'aperçu (200–2000) |
| `filePreview.longPressRing` | `true` | Cercle de progression près du pointeur pendant l'appui |
| `folderTree.enabled` | `true` | Interrupteur principal des dossiers dépliables dans les listes de dépôt |
| `commitBadges.enabled` | `true` | Interrupteur principal des badges Conventional Commits |
| `commitBadges.unknownTypes` | `true` | Styliser aussi les types en minuscules hors du jeu conventionnel |
| `commitBadges.breaking` | `true` | Marqueur rouge pour un préfixe `!` de changement incompatible |
| `translate.enabled` | `true` | Interrupteur principal de la traduction sur la page |
| `translate.provider` | `'google'` | `google` (gratuit), `deepl`, `microsoft`, `yandex`, `openai`, `libretranslate` |
| `translate.providerConfig.<id>` | selon le fournisseur | Identifiants et point de terminaison par fournisseur (clé API, région, dossier, modèle, URL) |
| `translate.targetLang` | `'auto'` | `'auto'` suit la langue des réglages ; sinon n'importe quel code proposé |
| `translate.mode` | `'button'` | `button` traduit au clic ; `auto` traduit les blocs dès qu'ils deviennent visibles |
| `translate.display` | `'replace'` | `replace` remplace le texte ; `below` affiche la traduction sous l'original |
| `translate.reveal` | `'button'` | Mode remplacement : `button` affiche **Afficher l'original** ; `hover` montre la source au survol ou au focus |
| `translate.linkLabels` | `true` | Traduire aussi le texte des liens |
| `translate.surfaces.<id>` | `true` | Interrupteurs par emplacement : `markdown`, `plaintext`, `commits`, `titles`, `preview` |
| `translate.cacheHours` | `24` | Durée du cache en heures (0 le désactive) |
| `commandPalette.enabled` | `true` | Interrupteur principal de la palette de commandes `Ctrl/⌘+K` |
| `commandPalette.shortcut` | `'mod+k'` | `mod+k`, `mod+shift+k`, `mod+space`, `alt+k`, `off` ou une combinaison enregistrée sur la page de réglages |
| `commandPalette.token` | `''` | Jeton GitHub facultatif pour les dépôts privés et des limites plus élevées (uniquement vers `api.github.com`, jamais exporté) |
| `commandPalette.sources.<id>` | `true` | Interrupteurs de source : `commands`, `repositories`, `starred`, `files`, `issues`, `recent` |
| `commandPalette.sources.issues` | `true` | Issues et pull requests ouvertes du dépôt courant |
| `commandPalette.hideForks` | `false` | Masquer les forks de dépôts |
| `commandPalette.hideArchived` | `false` | Masquer les dépôts archivés |
| `commandPalette.cacheHours` | `6` | Durée du cache des dépôts et arborescences en heures (0 le désactive) |
| `commandPalette.maxResults` | `30` | Nombre maximal de lignes par jeu de résultats (10–100) |
| `similarRepos.enabled` | `true` | Interrupteur principal de la barre latérale **Dépôts similaires** |
| `similarRepos.provider` | `'github'` | Source des données : `github` (recherche interne) ou `simrepo` (tiers) |
| `similarRepos.results` | `5` | Résultats par page (3–20) |
| `similarRepos.cacheHours` | `24` | Durée de vie du cache en heures (0 le désactive) |

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
