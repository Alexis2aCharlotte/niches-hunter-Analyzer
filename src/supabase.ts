import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";
import { NicheDraft, Niche } from "./types";

// ============================================
// Client Supabase
// ============================================

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

// ============================================
// Opérations sur niche_drafts
// ============================================

/**
 * Récupère tous les drafts non traités
 */
export async function getUnprocessedDrafts(): Promise<NicheDraft[]> {
  const supabase = getSupabaseClient();

  console.log("📥 Récupération des drafts non traités...");

  const { data, error } = await supabase
    .from("niche_drafts")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`❌ Erreur lors de la récupération des drafts: ${error.message}`);
  }

  console.log(`✅ ${data?.length || 0} draft(s) trouvé(s)`);
  return data || [];
}

/**
 * Marque un draft comme traité
 */
export async function markDraftAsProcessed(draftId: string): Promise<void> {
  const supabase = getSupabaseClient();

  console.log(`📝 Marquage du draft ${draftId} comme traité...`);

  const { error } = await supabase
    .from("niche_drafts")
    .update({ processed: true })
    .eq("id", draftId);

  if (error) {
    throw new Error(`❌ Erreur lors du marquage du draft: ${error.message}`);
  }

  console.log(`✅ Draft ${draftId} marqué comme traité`);
}

// ============================================
// Opérations sur niches
// ============================================

/**
 * Récupère le prochain ID disponible pour une niche
 * Format: "001", "002", etc.
 */
export async function getNextNicheId(): Promise<string> {
  const supabase = getSupabaseClient();

  console.log("🔢 Calcul du prochain ID de niche...");

  const { data, error } = await supabase
    .from("niches")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`❌ Erreur lors de la récupération du dernier ID: ${error.message}`);
  }

  let nextId: number;

  if (!data || data.length === 0) {
    nextId = 1;
  } else {
    // Extraire le numéro du dernier ID
    const lastId = data[0].id;
    const numericPart = parseInt(lastId, 10);
    nextId = isNaN(numericPart) ? 1 : numericPart + 1;
  }

  const formattedId = nextId.toString().padStart(3, "0");
  console.log(`✅ Prochain ID: ${formattedId}`);

  return formattedId;
}

/**
 * Insère une nouvelle niche dans la base de données
 */
export async function insertNiche(niche: Niche): Promise<void> {
  const supabase = getSupabaseClient();

  console.log(`📤 Insertion de la niche "${niche.title}"...`);

  const { error } = await supabase.from("niches").insert(niche);

  if (error) {
    throw new Error(`❌ Erreur lors de l'insertion de la niche: ${error.message}`);
  }

  console.log(`✅ Niche "${niche.title}" insérée avec succès (ID: ${niche.id})`);
}

// ============================================
// Test de connexion
// ============================================

/**
 * Teste la connexion à Supabase
 */
export async function testConnection(): Promise<boolean> {
  const supabase = getSupabaseClient();

  console.log("🔌 Test de connexion à Supabase...");

  try {
    // Test sur la table niche_drafts
    const { error: draftsError } = await supabase
      .from("niche_drafts")
      .select("id")
      .limit(1);

    if (draftsError) {
      console.error(`❌ Erreur sur niche_drafts: ${draftsError.message}`);
      return false;
    }

    console.log("   ✅ Table niche_drafts accessible");

    // Test sur la table niches
    const { error: nichesError } = await supabase
      .from("niches")
      .select("id")
      .limit(1);

    if (nichesError) {
      console.error(`❌ Erreur sur niches: ${nichesError.message}`);
      return false;
    }

    console.log("   ✅ Table niches accessible");
    console.log("✅ Connexion Supabase OK");

    return true;
  } catch (err) {
    console.error(`❌ Erreur de connexion: ${err}`);
    return false;
  }
}

