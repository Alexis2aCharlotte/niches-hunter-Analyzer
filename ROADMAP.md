# Roadmap - Améliorations Analyse de Niches

## Contexte

Feedback utilisateur identifiant des problèmes de cohérence et de rigueur dans les analyses générées.

---

## Phase 1 : Corrections Prompt GPT (Immédiat)

### 1.1 Cohérence géographique forcée

**Problème** : 3 endroits mentionnent la géographie avec des valeurs différentes
- `stats.market` → "FR"
- `market_analysis.geographicFocus` → ["US", "FR", "DE"]
- `move` → "Launch first in Germany"

**Solution** : Ajouter une règle stricte dans le prompt
- `stats.market` = marché principal recommandé
- `market_analysis.geographicFocus[0]` = DOIT être identique à `stats.market`
- `move` = DOIT mentionner le même pays que `stats.market`

---

### 1.2 Critères de compétition rigoureux

**Problème** : "Low competition" affiché sur des niches saturées (ex: apps couples = difficulty 74 sur Astro)

**Solution** : Ajouter des critères d'évaluation dans le prompt

| Niveau | Critères |
|--------|----------|
| **Low** | < 3 apps établies, marché naissant, pas de gros acteur dominant |
| **Medium** | 3-10 apps établies, différenciation possible, marché en croissance |
| **High** | > 10 apps établies, gros acteurs dominants, marché mature/saturé |

GPT doit évaluer en fonction des apps fournies en input + sa connaissance générale.

---

### 1.3 Section ASO Optimization (nouvelle)

**Problème** : Pas de mots-clés ASO recommandés

**Solution** : Ajouter une nouvelle section dans le JSON

```json
"aso_optimization": {
  "primary_keywords": ["keyword1", "keyword2", "keyword3"],
  "secondary_keywords": ["keyword4", "keyword5", "keyword6"],
  "app_name_ideas": ["AppName1", "AppName2", "AppName3"]
}
```

**Important** : 
- Pas de scores de volume/difficulté (GPT ne peut pas les estimer de manière fiable)
- Keywords présentés comme "suggestions à explorer"
- L'utilisateur doit valider avec un outil ASO (AppFigures, Astro)

---

## Phase 2 : Améliorations futures (Optionnel)

### 2.1 Intégration AppFigures API

**Objectif** : Données ASO réelles (popularity, difficulty)

**Coût** : $44.99 - $149.99/mois selon le plan

**Bénéfices** :
- Validation automatique des keywords suggérés
- Scores de compétition basés sur données réelles
- Crédibilité accrue des analyses

### 2.2 Score d'opportunité amélioré

**Objectif** : Revoir le calcul du `score` (0-100) pour refléter le ratio popularité/difficulté

**Formule potentielle** :
```
score = f(market_potential, competition_level, timing, gap_identified)
```

À définir avec des données réelles (Phase 2.1 requise).

---

### 1.4 Simplification Market Analysis

**Problème** : Section trop "pompeuse" avec des termes techniques (CAGR, $3.5B market size)

**Solution** : 
- Remplacer `totalMarketSize` par `opportunityWindow` (fenêtre d'opportunité)
- Simplifier `growthRate` (pas de "CAGR", juste "+X%/an")

**Avant** :
```json
"market_analysis": {
  "totalMarketSize": "$3.5B creator analytics...",
  "growthRate": "+18% CAGR through 2030",
  "targetAudience": "...",
  "geographicFocus": ["US", "GB", "FR"]
}
```

**Après** :
```json
"market_analysis": {
  "opportunityWindow": "Now|6 months|12 months|Saturating",
  "growthRate": "+18%/year",
  "targetAudience": "...",
  "geographicFocus": ["FR", "US", "DE"]
}
```

---

### 1.5 Enrichir la section Trending Apps

**Problème** : Seulement 1 app affichée (celle de l'input), pas assez de contexte marché

**Solution** : Demander à GPT d'ajouter minimum 3 apps similaires connues

**Règles pour GPT** :
- Minimum 3 apps en plus de celles de l'input
- Apps réelles, vérifiables sur l'App Store
- Apps qui font de l'argent dans cette niche
- Ne pas inventer d'apps fictives

**Résultat** : 4+ apps dans trending (1 input + 3 marché minimum)

---

## Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `src/types.ts` | Ajouter interface `ASOOptimization` |
| `src/gpt.ts` | Mettre à jour le prompt avec nouvelles règles |

---

## Checklist Phase 1

- [ ] Modifier `types.ts` - Ajouter `ASOOptimization`
- [ ] Modifier `gpt.ts` - Règle cohérence géographique
- [ ] Modifier `gpt.ts` - Critères compétition
- [ ] Modifier `gpt.ts` - Section ASO dans le prompt
- [ ] Tester avec une niche existante
- [ ] Valider la cohérence des résultats
