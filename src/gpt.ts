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
  return `You are a mobile market analysis expert. Generate analysis in JSON format.

INPUT DATA:
- Niche title: ${draft.title}
- Apps identified: ${JSON.stringify(draft.apps, null, 2)}
- Opportunity summary: ${draft.summary}

GENERATE JSON with this EXACT structure. BE CONCISE and precise - short sentences:

{
  "id": "${nicheId}",
  "title": "${draft.title}",
  "category": "[ONE of: Education, Entertainment, Health & Fitness, Lifestyle, Productivity, Finance, Social Networking, Games, Photo & Video, Utilities]",
  "tags": ["TAG1", "TAG2", "TAG3"],
  "score": [0-100],
  "opportunity": "[2-3 sentences: WHO is the target user + WHAT problem they face + WHY now (cite app ranks or market signals from input data)]",
  "gap": "[2 sentences: WHAT exists today + WHAT is missing that frustrates users]",
  "move": "[2-3 sentences: SPECIFIC app idea + TARGET audience + KEY differentiator + RECOMMENDED MARKET (must match stats.market)]",
  "stats": {
    "competition": "Low|Medium|High",
    "potential": "Medium|High|Very High",
    "revenue": "$XK-$YK",
    "market": "🇫🇷 FR",
    "timeToMVP": "X-Y weeks",
    "difficulty": "Low|Medium|Medium-High|High"
  },
  "market_analysis": {
    "totalMarketSize": "$X.XB short description",
    "growthRate": "+XX%/year",
    "targetAudience": "[SHORT description]",
    "geographicFocus": ["XX", "YY", "ZZ"]
  },
  "key_learnings": [
    "[SHORT insight with number, 15 words max]",
    "[SHORT insight with number, 15 words max]",
    "[SHORT insight with number, 15 words max]",
    "[SHORT insight with number, 15 words max]",
    "[SHORT insight with number, 15 words max]",
    "[SHORT insight with number, 15 words max]"
  ],
  "improvements": [
    "[SHORT improvement, 10 words max]",
    "[SHORT improvement, 10 words max]",
    "[SHORT improvement, 10 words max]",
    "[SHORT improvement, 10 words max]",
    "[SHORT improvement, 10 words max]",
    "[SHORT improvement, 10 words max]"
  ],
  "marketing_strategies": [
    {"channel": "Social Media", "strategy": "[1 SHORT sentence]", "estimatedCost": "$X,XXX/month"},
    {"channel": "Content Marketing", "strategy": "[1 SHORT sentence]", "estimatedCost": "$X,XXX/month"},
    {"channel": "Partnerships", "strategy": "[1 SHORT sentence]", "estimatedCost": "$X,XXX/month"}
  ],
  "monetization": {
    "model": "Freemium with in-app purchases",
    "pricing": "$X.XX/month for premium features",
    "conversionRate": "X-Y%"
  },
  "tech_stack": ["Tech1", "Tech2", "Tech3", "Tech4"],
  "risks": [
    "[SHORT risk, 10 words max]",
    "[SHORT risk, 10 words max]",
    "[SHORT risk, 10 words max]",
    "[SHORT risk, 10 words max]"
  ],
  "trending": [
    {
      "name": "[app name]",
      "category": "[category]",
      "growth": "+XX%",
      "description": "[1 SHORT sentence about the app]",
      "strongMarket": "🇫🇷 FR",
      "estimatedMRR": "$XK-$YK",
      "keyPoints": ["[3 words]", "[3 words]", "[3 words]"],
      "weakPoints": ["[3 words]", "[3 words]", "[3 words]"]
    }
  ],
  "locked": false,
  "has_premium": true
}

=== GEOGRAPHIC CONSISTENCY (MANDATORY) ===
The market recommendation MUST be consistent across all fields:
1. stats.market = the PRIMARY recommended market (e.g., "🇫🇷 FR")
2. market_analysis.geographicFocus[0] = MUST match stats.market (same country code, e.g., "FR")
3. The "move" field = MUST mention the same market as stats.market for launch recommendation
Example: If stats.market is "🇫🇷 FR", then geographicFocus must start with "FR", and move must say "launch in France" (NOT Germany, NOT Italy, NOT any other country)

=== COMPETITION EVALUATION CRITERIA (MANDATORY) ===
Evaluate competition based on these STRICT criteria:
- "Low": Less than 3 established apps in this specific niche, emerging market, no dominant player, apps have <100K downloads
- "Medium": 3-10 established apps, differentiation possible, growing market, some apps with 100K-1M downloads
- "High": More than 10 established apps, dominant players exist (>1M downloads), saturated market, well-known brands present
Be CONSERVATIVE: if unsure, choose Medium or High. Do NOT mark as "Low" if popular apps exist in this space.

=== TRENDING APPS ===
- Use ONLY the apps provided in the input data for the "trending" array
- Do NOT add or invent any additional apps
- If only 1 app is provided in input, include only that 1 app in trending

=== OTHER RULES ===
- ONLY output valid JSON, no text before or after
- BE CONCISE - every field should be SHORT and precise
- Max 15 words per key_learning
- Max 10 words per improvement and risk
- Max 1 sentence per marketing strategy
- growthRate format: "+XX%/year" (not CAGR)`;
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
        max_completion_tokens: 4000,
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

