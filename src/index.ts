import { validateConfig } from "./config";
import { testConnection, getUnprocessedDrafts } from "./supabase";
import { analyzeDraft } from "./analyzer";

// ============================================
// Mode CRON (backup)
// ============================================

async function main(): Promise<void> {
  console.log("🚀 ════════════════════════════════════════");
  console.log("   NICHE ANALYZER - Mode CRON");
  console.log("   ════════════════════════════════════════\n");

  try {
    // Étape 1: Valider la configuration
    validateConfig();
    console.log("");

    // Étape 2: Tester la connexion Supabase
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Impossible de se connecter à Supabase");
    }
    console.log("");

    // Étape 3: Récupérer les drafts non traités
    const drafts = await getUnprocessedDrafts();

    if (drafts.length === 0) {
      console.log("ℹ️  Aucun draft à traiter. Fin du script.");
      return;
    }

    console.log(`\n📋 ${drafts.length} draft(s) à traiter:\n`);
    drafts.forEach((draft, index) => {
      console.log(`   ${index + 1}. "${draft.title}"`);
      console.log(`      📱 ${draft.apps?.length || 0} app(s) associée(s)`);
      console.log(`      📅 Date newsletter: ${draft.newsletter_date}`);
    });
    console.log("");

    // Étape 4: Traiter chaque draft
    let successCount = 0;
    let errorCount = 0;

    for (const draft of drafts) {
      const result = await analyzeDraft(draft);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log("\n✅ ════════════════════════════════════════");
    console.log("   NICHE ANALYZER - Terminé");
    console.log("   ════════════════════════════════════════");
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log("   ════════════════════════════════════════\n");

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ ════════════════════════════════════════");
    console.error("   ERREUR FATALE");
    console.error("   ════════════════════════════════════════");
    console.error(error);
    process.exit(1);
  }
}

main();
