import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

interface Config {
  supabase: {
    url: string;
    serviceKey: string;
  };
  openai: {
    apiKey: string;
  };
}

function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`❌ Variable d'environnement manquante: ${name}`);
  }
  return value || "";
}

export const config: Config = {
  supabase: {
    url: getEnvVar("SUPABASE_URL"),
    serviceKey: getEnvVar("SUPABASE_SERVICE_KEY"),
  },
  openai: {
    apiKey: getEnvVar("OPENAI_API_KEY"),
  },
};

export function validateConfig(): void {
  console.log("🔧 Validation de la configuration...");

  if (!config.supabase.url.startsWith("https://")) {
    throw new Error("❌ SUPABASE_URL doit commencer par https://");
  }

  if (!config.supabase.serviceKey) {
    throw new Error("❌ SUPABASE_SERVICE_KEY est requis");
  }

  if (!config.openai.apiKey) {
    throw new Error("❌ OPENAI_API_KEY est requis");
  }

  console.log("✅ Configuration validée");
  console.log(`   📡 Supabase URL: ${config.supabase.url}`);
  console.log(`   🔑 Supabase Key: ${config.supabase.serviceKey.substring(0, 20)}...`);
  console.log(`   🤖 OpenAI Key: ${config.openai.apiKey.substring(0, 10)}...`);
}

