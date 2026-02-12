export const TIER_LIMITS = {
    free: { maxSongs: 20, maxSetlists: 3 },
    pro: { maxSongs: Infinity, maxSetlists: Infinity },
    studio: { maxSongs: Infinity, maxSetlists: Infinity },
};
/** Ordered by tier weight for comparison */
const TIER_WEIGHT = {
    free: 0,
    pro: 1,
    studio: 2,
};
export function tierAtLeast(userTier, requiredTier) {
    return TIER_WEIGHT[userTier] >= TIER_WEIGHT[requiredTier];
}
export const FEATURE_GATES = [
    {
        feature: "advanced_practice",
        requiredTier: "pro",
        label: "Practice Avanzado",
        description: "Loops, speed trainer y herramientas de ensayo avanzadas",
    },
    {
        feature: "gamification",
        requiredTier: "pro",
        label: "Gamificación",
        description: "Streaks, achievements y tracking de progreso",
    },
    {
        feature: "ai_suggestions",
        requiredTier: "pro",
        label: "AI Chord Suggestions",
        description: "Sugerencias inteligentes de progresiones y acordes",
    },
    {
        feature: "setlists",
        requiredTier: "pro",
        label: "Unlimited Setlists",
        description: "Create unlimited performance sets to prepare for any show",
    },
    {
        feature: "setlist_share",
        requiredTier: "pro",
        label: "Share with Band",
        description: "Share your setlists with bandmates for rehearsal coordination",
    },
    {
        feature: "setlist_export",
        requiredTier: "pro",
        label: "Export as PDF",
        description: "Export your setlist as a printable PDF for stage use",
    },
    {
        feature: "bands",
        requiredTier: "studio",
        label: "Bandas",
        description: "Crea y gestiona bandas con repertorio compartido",
    },
    {
        feature: "events",
        requiredTier: "studio",
        label: "Eventos",
        description: "Gestionar eventos y vender entradas",
    },
    {
        feature: "live_mode",
        requiredTier: "studio",
        label: "Live Mode",
        description: "Scroll sincronizado para shows en vivo",
    },
];
export function getGateForFeature(feature) {
    return FEATURE_GATES.find((g) => g.feature === feature);
}
export const TIER_DISPLAY = {
    free: { label: "Free", icon: "🎵", color: "#888" },
    pro: { label: "Pro", icon: "⭐", color: "#c9a227" },
    studio: { label: "Studio", icon: "👑", color: "#e8b923" },
};
