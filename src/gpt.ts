import OpenAI from "openai";
import { config } from "./config";
import { NicheDraft, Niche, GPTNicheResponse } from "./types";

// ============================================
// Client OpenAI
// ============================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

// ============================================
// Prompt GPT
// ============================================

function buildPrompt(draft: NicheDraft, nicheId: string): string {
  return `Tu es un expert en analyse de marché mobile. À partir des données d'une niche identifiée, génère une analyse complète et détaillée au format JSON.

DONNÉES D'ENTRÉE :
- Titre de la niche : ${draft.title}
- Apps identifiées : ${JSON.stringify(draft.apps, null, 2)}
- Résumé de l'opportunité : ${draft.summary}

GÉNÈRE UN JSON avec cette structure EXACTE. Tous les champs sont OBLIGATOIRES :

{
  "id": "${nicheId}",
  "title": "${draft.title}",
  "category": "[une seule parmi : Education, Entertainment, Health & Fitness, Lifestyle, Productivity, Finance, Social Networking, Games, Photo & Video, Utilities]",
  "tags": ["[3 tags max en MAJUSCULES]"],
  "score": [0-100, calculé selon potentiel × 0.4 + faible compétition × 0.3 + timing × 0.3],
  "opportunity": "[développe le résumé en 2-3 phrases détaillées]",
  "gap": "[identifie précisément ce qui manque sur le marché actuel]",
  "move": "[action concrète recommandée pour un developper]",
  "stats": {
    "competition": "[Low/Medium/High]",
    "potential": "[Medium/High/Very High]",
    "revenue": "[$XK-$YK]",
    "market": "[emoji drapeau + code pays du marché principal]",
    "timeToMVP": "[X-Y weeks]",
    "difficulty": "[Low/Medium/Medium-High/High]"
  },
  "market_analysis": {
    "totalMarketSize": "[$X.XB avec description]",
    "growthRate": "[+XX% CAGR through YYYY]",
    "targetAudience": "[description démographique précise]",
    "geographicFocus": ["[liste des pays cibles]"]
  },
  "key_learnings": ["[4-6 insights basés sur les données, avec chiffres]"],
  "improvements": ["[4-6 améliorations concrètes à apporter]"],
  "marketing_strategies": [
    {"channel": "[canal]", "strategy": "[stratégie détaillée]", "estimatedCost": "[coût estimé]"}
  ],
  "monetization": {
    "model": "[modèle de monétisation]",
    "pricing": "[prix recommandé]",
    "conversionRate": "[taux de conversion attendu]"
  },
  "tech_stack": ["[4-6 technologies recommandées]"],
  "risks": ["[3-4 risques majeurs à considérer]"],
  "trending": [
    {
      "name": "[nom de l'app]",
      "category": "[catégorie]",
      "growth": "[+XX%]",
      "description": "[2-3 phrases sur l'app et son succès]",
      "strongMarket": "[emoji + pays]",
      "estimatedMRR": "[$XK-$YK]",
      "keyPoints": ["[3 points forts]"],
      "weakPoints": ["[3 faiblesses]"]
    }
  ],
  "locked": false,
  "has_premium": true
}

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT avec le JSON, pas de texte avant ou après
- Réponds en anglais obligatoirement
- Utilise les données des apps fournies pour remplir la section "trending"
- Les key_learnings doivent contenir des données chiffrées quand possible
- Les marketing_strategies doivent être actionnables avec des coûts réalistes
- Le score doit refléter objectivement l'attractivité de la niche
- Génère au moins 3 marketing_strategies différentes
- Génère une entrée "trending" pour CHAQUE app fournie dans les données`;
}

// ============================================
// Génération de l'analyse
// ============================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Génère une analyse complète de niche via GPT
 */
export async function generateNicheAnalysis(
  draft: NicheDraft,
  nicheId: string
): Promise<Niche> {
  const openai = getOpenAIClient();
  const prompt = buildPrompt(draft, nicheId);

  console.log("🤖 Appel GPT-5.1 pour générer l'analyse...");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`   📡 Tentative ${attempt}/${MAX_RETRIES}...`);

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en analyse de marché mobile. Tu réponds uniquement en JSON valide, sans markdown, sans commentaires.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Réponse GPT vide");
      }

      // Parser le JSON
      const parsed = parseGPTResponse(content);

      // Ajouter published_at
      const niche: Niche = {
        ...parsed,
        published_at: new Date().toISOString(),
      };

      console.log("   ✅ Analyse générée avec succès");
      return niche;
    } catch (error) {
      lastError = error as Error;
      console.error(`   ❌ Erreur tentative ${attempt}: ${lastError.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`   ⏳ Nouvelle tentative dans ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Échec après ${MAX_RETRIES} tentatives: ${lastError?.message}`
  );
}

// ============================================
// Parsing de la réponse GPT
// ============================================

function parseGPTResponse(content: string): GPTNicheResponse {
  // Nettoyer la réponse (enlever les backticks markdown si présents)
  let cleaned = content.trim();

  // Enlever ```json et ``` si présents
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned) as GPTNicheResponse;

    // Validation basique des champs obligatoires
    const requiredFields = [
      "id",
      "title",
      "category",
      "tags",
      "score",
      "opportunity",
      "gap",
      "move",
      "stats",
      "market_analysis",
      "key_learnings",
      "improvements",
      "marketing_strategies",
      "monetization",
      "tech_stack",
      "risks",
      "trending",
    ];

    for (const field of requiredFields) {
      if (!(field in parsed)) {
        throw new Error(`Champ obligatoire manquant: ${field}`);
      }
    }

    return parsed;
  } catch (error) {
    console.error("❌ Erreur de parsing JSON:");
    console.error("   Contenu reçu:", cleaned.substring(0, 500));
    throw new Error(`JSON invalide: ${(error as Error).message}`);
  }
}

