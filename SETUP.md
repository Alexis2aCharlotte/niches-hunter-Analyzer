# 🚀 Niche Analyzer - Guide de Déploiement

## Checklist

### 1. Préparation du code
- [x] Créer le projet TypeScript
- [x] Configurer Supabase client
- [x] Intégrer OpenAI GPT
- [x] Créer le serveur webhook Express
- [ ] Push sur GitHub

### 2. Déploiement Railway
- [ ] Créer un nouveau projet Railway
- [ ] Connecter le repo GitHub
- [ ] Configurer les variables d'environnement :
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `OPENAI_API_KEY`
  - [ ] `PORT` (optionnel, Railway le gère auto)
- [ ] Vérifier que le déploiement est OK
- [ ] Récupérer l'URL publique Railway

### 3. Configuration Supabase Webhook
- [ ] Aller dans Supabase → Database → Webhooks
- [ ] Créer un nouveau webhook avec :
  - Name: `niche-draft-analyzer`
  - Table: `niche_drafts`
  - Events: `INSERT` uniquement
  - Type: `HTTP Request`
  - Method: `POST`
  - URL: `https://[TON-APP].up.railway.app/webhook`
  - Headers: `Content-Type: application/json`
- [ ] Activer le webhook

### 4. Test end-to-end
- [ ] Insérer un draft test dans Supabase
- [ ] Vérifier les logs Railway
- [ ] Vérifier que la niche apparaît dans la table `niches`
- [ ] Vérifier que le draft est marqué `processed = true`

---

## 📝 Notes de configuration

### URL Railway finale
```
https://________________________________.up.railway.app
```

### Commandes utiles

```bash
# Dev local (webhook mode)
npm run dev

# Dev local (cron mode)
npm run dev:cron

# Build production
npm run build

# Start production
npm start
```

### Structure des endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/webhook` | POST | Reçoit les webhooks Supabase |

---

## 🔧 Dépannage

### Le webhook ne se déclenche pas
1. Vérifier que le webhook est activé dans Supabase
2. Vérifier que l'URL Railway est correcte
3. Vérifier les logs Supabase (Database → Webhooks → Logs)

### Erreur 500 sur le webhook
1. Vérifier les logs Railway
2. Vérifier que les variables d'environnement sont configurées
3. Vérifier que OpenAI API key est valide

### Le draft n'est pas marqué comme processed
1. Vérifier que la SUPABASE_SERVICE_KEY a les droits d'écriture
2. Vérifier les logs pour voir l'erreur exacte

