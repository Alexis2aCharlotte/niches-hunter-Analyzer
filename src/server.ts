import express, { Request, Response } from "express";
import { validateConfig } from "./config";
import { testConnection } from "./supabase";
import { analyzeDraft } from "./analyzer";
import { NicheDraft } from "./types";

// ============================================
// Configuration Express
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// ============================================
// Types pour le payload Supabase Webhook
// ============================================

interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: NicheDraft | null;
  old_record: NicheDraft | null;
}

// ============================================
// Health Check
// ============================================

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "niche-analyzer",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Webhook Endpoint
// ============================================

app.post("/webhook", async (req: Request, res: Response) => {
  const startTime = Date.now();

  console.log("\n🔔 ════════════════════════════════════════");
  console.log("   WEBHOOK REÇU");
  console.log("   ════════════════════════════════════════\n");

  try {
    const payload = req.body as SupabaseWebhookPayload;

    // Log du payload reçu
    console.log(`📦 Type: ${payload.type}`);
    console.log(`📋 Table: ${payload.table}`);

    // Vérifier que c'est un INSERT sur niche_drafts
    if (payload.type !== "INSERT") {
      console.log(`⏭️  Type ${payload.type} ignoré (on traite uniquement INSERT)`);
      res.json({ success: true, message: "Ignored - not an INSERT" });
      return;
    }

    if (payload.table !== "niche_drafts") {
      console.log(`⏭️  Table ${payload.table} ignorée`);
      res.json({ success: true, message: "Ignored - wrong table" });
      return;
    }

    // Vérifier qu'on a bien le record
    if (!payload.record) {
      console.error("❌ Pas de record dans le payload");
      res.status(400).json({ success: false, error: "No record in payload" });
      return;
    }

    const draft = payload.record;
    console.log(`\n📝 Draft reçu: "${draft.title}"`);
    console.log(`   ID: ${draft.id}`);
    console.log(`   Apps: ${draft.apps?.length || 0}`);

    // Analyser le draft
    const result = await analyzeDraft(draft);

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`\n✅ ════════════════════════════════════════`);
      console.log(`   WEBHOOK TERMINÉ (${duration}ms)`);
      console.log(`   Niche ID: ${result.nicheId}`);
      console.log(`   ════════════════════════════════════════\n`);

      res.json({
        success: true,
        nicheId: result.nicheId,
        duration: `${duration}ms`,
      });
    } else {
      console.error(`\n❌ ════════════════════════════════════════`);
      console.error(`   WEBHOOK ÉCHOUÉ (${duration}ms)`);
      console.error(`   Erreur: ${result.error}`);
      console.error(`   ════════════════════════════════════════\n`);

      res.status(500).json({
        success: false,
        error: result.error,
        duration: `${duration}ms`,
      });
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`\n❌ Erreur webhook: ${errorMessage}`);

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// ============================================
// Démarrage du serveur
// ============================================

async function startServer(): Promise<void> {
  console.log("🚀 ════════════════════════════════════════");
  console.log("   NICHE ANALYZER - Mode Webhook");
  console.log("   ════════════════════════════════════════\n");

  try {
    // Valider la configuration
    validateConfig();
    console.log("");

    // Tester la connexion Supabase
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Impossible de se connecter à Supabase");
    }
    console.log("");

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🌐 Serveur démarré sur le port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Webhook: http://localhost:${PORT}/webhook`);
      console.log("");
      console.log("⏳ En attente de webhooks...\n");
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage:", error);
    process.exit(1);
  }
}

startServer();

