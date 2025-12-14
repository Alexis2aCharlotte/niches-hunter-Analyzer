import {
  getNextNicheId,
  insertNiche,
  markDraftAsProcessed,
} from "./supabase";
import { generateNicheAnalysis } from "./gpt";
import { NicheDraft } from "./types";

// ============================================
// Analyse d'un draft (logique commune)
// ============================================

export interface AnalysisResult {
  success: boolean;
  nicheId?: string;
  error?: string;
}

/**
 * Traite un draft et génère l'analyse complète
 * Utilisé par le mode CRON et le mode Webhook
 */
export async function analyzeDraft(draft: NicheDraft): Promise<AnalysisResult> {
  console.log(`\n🔄 ────────────────────────────────────────`);
  console.log(`   Traitement: "${draft.title}"`);
  console.log(`   ────────────────────────────────────────\n`);

  try {
    // Vérifier que le draft n'est pas déjà traité
    if (draft.processed) {
      console.log(`⏭️  Draft déjà traité, on skip`);
      return { success: true, error: "Already processed" };
    }

    // Récupérer le prochain ID
    const nicheId = await getNextNicheId();

    // Afficher les données du draft
    console.log("📊 Données du draft:");
    console.log(`   - ID: ${draft.id}`);
    console.log(`   - Titre: ${draft.title}`);
    console.log(`   - Nombre d'apps: ${draft.apps?.length || 0}`);
    console.log(`   - Summary: ${draft.summary?.substring(0, 100)}...`);
    console.log("");

    // Appeler GPT pour générer l'analyse complète
    const niche = await generateNicheAnalysis(draft, nicheId);

    console.log("");
    console.log("📋 Analyse générée:");
    console.log(`   - ID: ${niche.id}`);
    console.log(`   - Catégorie: ${niche.category}`);
    console.log(`   - Score: ${niche.score}/100`);
    console.log(`   - Tags: ${niche.tags.join(", ")}`);
    console.log(`   - Competition: ${niche.stats.competition}`);
    console.log(`   - Potential: ${niche.stats.potential}`);
    console.log(`   - Trending apps: ${niche.trending.length}`);
    console.log("");

    // Insérer dans la table niches
    await insertNiche(niche);

    // Marquer le draft comme traité
    await markDraftAsProcessed(draft.id);

    console.log(`\n✅ Draft "${draft.title}" traité avec succès!`);
    
    return { success: true, nicheId: niche.id };
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`\n❌ Erreur lors du traitement du draft "${draft.title}":`);
    console.error(`   ${errorMessage}`);
    
    return { success: false, error: errorMessage };
  }
}

