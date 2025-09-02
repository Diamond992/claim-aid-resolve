# 🔧 Guide de Correction : Secrets Supabase Edge Functions

## Problème Identifié
Les variables d'environnement (`OPENAI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`) apparaissent dans Supabase Studio mais retournent `undefined` dans l'Edge Function.

## ✅ Solution Étape par Étape

### 1. **Vérifier l'Installation CLI Supabase**
```bash
# Vérifier que CLI est installé et à jour
npm install -g supabase
supabase --version

# Se connecter à votre projet
supabase login
supabase link --project-ref odemkncodjxdtxmkgqpr
```

### 2. **Reconfigurer les Secrets** 
```bash
# Définir/redéfinir les secrets un par un
supabase secrets set OPENAI_API_KEY=sk-votre-cle-openai
supabase secrets set GROQ_API_KEY=gsk_votre-cle-groq  
supabase secrets set MISTRAL_API_KEY=votre-cle-mistral

# Vérifier que les secrets sont bien enregistrés
supabase secrets list
```

### 3. **Redéployer la Fonction (OBLIGATOIRE)**
```bash
# Redéployer pour que les nouveaux secrets soient injectés
supabase functions deploy generate-ai-courrier

# Vérifier le déploiement
supabase functions list
```

### 4. **Vérifier les Logs en Temps Réel**
```bash
# Terminal 1: Suivre les logs
supabase functions logs generate-ai-courrier --follow

# Terminal 2: Tester la fonction depuis Lovable
# (Générer un courrier depuis l'interface admin)
```

### 5. **Test depuis Supabase Studio**
1. Aller sur : https://supabase.com/dashboard/project/odemkncodjxdtxmkgqpr/functions
2. Cliquer sur `generate-ai-courrier` > Onglet "Invoke"
3. Tester avec ce payload :
```json
{
  "dossierId": "un-id-de-dossier-existant",
  "typeCourrier": "reclamation_interne",
  "tone": "ferme",
  "length": "moyen"
}
```

## 🔍 Signes de Succès

### Dans les Logs, vous devez voir :
```
✅ DIAGNOSTIC: Clés IA détectées:
- MISTRAL_API_KEY: sk-abc123...
- GROQ_API_KEY: gsk-xyz789...  
- OPENAI_API_KEY: sk-def456...

🔧 Configuration IA: { Mistral: true, Groq: true, OpenAI: true }
```

### ❌ Si Encore des Erreurs
```
❌ DIAGNOSTIC: Clés IA détectées:
- MISTRAL_API_KEY: MANQUANT
- GROQ_API_KEY: MANQUANT
- OPENAI_API_KEY: MANQUANT
```

## 🚨 Troubleshooting Avancé

### Problème 1: Secrets listés mais toujours `undefined`
```bash
# Supprimer et recréer les secrets
supabase secrets unset OPENAI_API_KEY
supabase secrets unset GROQ_API_KEY  
supabase secrets unset MISTRAL_API_KEY

# Attendre 30 secondes puis recréer
supabase secrets set OPENAI_API_KEY=votre-nouvelle-cle
# etc...

# Redéployer OBLIGATOIREMENT
supabase functions deploy generate-ai-courrier
```

### Problème 2: Edge Function ne se redéploie pas
```bash
# Forcer le redéploiement
supabase functions delete generate-ai-courrier
supabase functions deploy generate-ai-courrier

# Ou faire un reset complet
supabase functions reset
supabase functions deploy generate-ai-courrier
```

### Problème 3: Permissions CLI
```bash
# Se reconnecter avec un token fresh
supabase auth logout
supabase auth login
supabase link --project-ref odemkncodjxdtxmkgqpr
```

## 📋 Checklist Finale

- [ ] CLI Supabase installé et connecté
- [ ] Secrets définis avec `supabase secrets set`
- [ ] Secrets listés avec `supabase secrets list`  
- [ ] Fonction redéployée avec `supabase functions deploy`
- [ ] Logs montrent les clés détectées (format `sk-abc123...`)
- [ ] Test depuis Lovable admin fonctionne
- [ ] Pas d'erreur 500 dans les logs

## 🎯 Commandes de Résolution Rapide

```bash
# Script complet de correction
supabase secrets set OPENAI_API_KEY=votre-cle-openai
supabase secrets set GROQ_API_KEY=votre-cle-groq
supabase secrets set MISTRAL_API_KEY=votre-cle-mistral
supabase functions deploy generate-ai-courrier
supabase functions logs generate-ai-courrier --follow
```

Le problème devrait être résolu après ces étapes. Les logs montreront `Configuration IA: { Mistral: true, Groq: true, OpenAI: true }` au lieu de `false`.