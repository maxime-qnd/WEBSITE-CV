# qndesign — landing page

Landing page d'une seule page pour **qndesign** : conception lumière, régie et réseaux
audiovisuels pour le spectacle vivant. Style clair et épuré, mode sombre automatique. Statique, sans dépendance ni étape de build — trois
fichiers suffisent à le mettre en ligne.

## Aperçu local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

(ou ouvrir directement `index.html` dans un navigateur)

## Structure

```
index.html               page unique (contenu + données SEO/JSON-LD)
assets/css/style.css     styles (clair/sombre auto, responsive, impression)
assets/js/main.js        nav au scroll, apparitions, copie de l'e-mail, année du footer
assets/img/favicon.svg   logo qndesign (carré + « spot ») utilisé comme favicon
assets/contact.vcf       carte de visite numérique téléchargeable (vCard 3.0)
```

## À compléter avant mise en ligne

Les emplacements à remplir sont balisés par un commentaire `TODO` dans `index.html` :

| Élément | Où |
|---|---|
| Téléphone | bloc contact + `assets/contact.vcf` |
| Ville de rattachement | bloc contact + `assets/contact.vcf` |
| LinkedIn / Instagram | `.social-links` (supprimer les lignes inutiles) |
| SIRET | pied de page |
| URL définitive du site | balises `canonical`, `og:url`, JSON-LD, `assets/contact.vcf` |
| Image de partage 1200×630 | `assets/img/og-image.png` + balise `og:image` |

Le texte des activités, les listes de savoir-faire (consoles, protocoles, logiciels de
prévisu) et les domaines d'intervention sont des propositions : à ajuster au parc et aux
outils réellement pratiqués.

## Personnalisation rapide du thème

Toutes les couleurs sont des variables CSS en haut de `assets/css/style.css` :

```css
:root {
  --bg:     #f7f7f4;   /* fond clair */
  --ink:    #111113;   /* texte */
  --accent: #ff5a1f;   /* couleur de signature (le « spot ») */
}
```

Les valeurs du mode sombre sont redéfinies juste en dessous (`prefers-color-scheme: dark`).
Changer `--accent` suffit à changer la signature : puces, kickers, survols et halo du
bloc contact suivent.

## Choix techniques

- **Aucune dépendance externe** hors Google Fonts (Inter, Inter Tight, JetBrains Mono) : les icônes sont
  des SVG inline, donc pas de CDN d'icônes à charger ni à surveiller.
- **Accessibilité** : lien d'évitement, contrastes élevés, styles de focus visibles,
  libellés ARIA sur les liens sociaux, respect de `prefers-reduced-motion`.
- **Sans JavaScript**, le contenu reste entièrement visible (les animations d'apparition ne
  sont activées que si JS est présent).
- **Feuille d'impression** : la page s'imprime (ou s'exporte en PDF) en version claire et
  lisible, décor et boutons retirés.
- **SEO** : `<meta description>`, Open Graph, Twitter Card et données structurées
  schema.org `ProfessionalService`.

## Mise en ligne

Site statique : n'importe quel hébergement fait l'affaire.

- **GitHub Pages** : Settings → Pages → source `Deploy from a branch`, branche voulue, dossier `/root`.
- **Netlify / Cloudflare Pages** : glisser-déposer le dossier, aucune commande de build.
- **Hébergement classique (OVH, Infomaniak…)** : envoyer les fichiers en FTP à la racine du domaine.
