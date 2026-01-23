// ============================================
// Types pour niche_drafts (table d'entrée)
// ============================================

export interface AppInfo {
  name: string;
  category?: string;
  downloads?: string;
  revenue?: string;
  growth?: string;
  description?: string;
  [key: string]: unknown; // Pour les champs additionnels
}

export interface NicheDraft {
  id: string;
  title: string;
  apps: AppInfo[];
  summary: string;
  newsletter_date: string;
  processed: boolean;
  created_at: string;
}

// ============================================
// Types pour niches (table de sortie)
// ============================================

export interface NicheStats {
  competition: "Low" | "Medium" | "High";
  potential: "Medium" | "High" | "Very High";
  revenue: string;
  market: string;
  timeToMVP: string;
  difficulty: "Low" | "Medium" | "Medium-High" | "High";
}

export interface MarketAnalysis {
  totalMarketSize: string;
  growthRate: string;
  targetAudience: string;
  geographicFocus: string[];
}

export interface MarketingStrategy {
  channel: string;
  strategy: string;
  estimatedCost: string;
}

export interface Monetization {
  model: string;
  pricing: string;
  conversionRate: string;
}

export interface TrendingApp {
  name: string;
  category: string;
  growth: string;
  description: string;
  strongMarket: string;
  estimatedMRR: string;
  keyPoints: string[];
  weakPoints: string[];
}

export interface ASOOptimization {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  appNameIdeas: string[];
}

export interface Niche {
  id: string;
  title: string;
  category: NicheCategory;
  tags: string[];
  score: number;
  opportunity: string;
  gap: string;
  move: string;
  stats: NicheStats;
  market_analysis: MarketAnalysis;
  key_learnings: string[];
  improvements: string[];
  marketing_strategies: MarketingStrategy[];
  monetization: Monetization;
  tech_stack: string[];
  risks: string[];
  trending: TrendingApp[];
  aso_optimization: ASOOptimization;
  locked: boolean;
  has_premium: boolean;
  published_at: string;
}

export type NicheCategory =
  | "Education"
  | "Entertainment"
  | "Health & Fitness"
  | "Lifestyle"
  | "Productivity"
  | "Finance"
  | "Social Networking"
  | "Games"
  | "Photo & Video"
  | "Utilities";

// ============================================
// Types pour les réponses GPT
// ============================================

export type GPTNicheResponse = Omit<Niche, "published_at">;

