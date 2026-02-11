export type SubscriptionTier = "free" | "pro" | "studio";
export interface TierLimits {
    maxSongs: number;
    maxSetlists: number;
}
export interface FeatureGate {
    feature: string;
    requiredTier: SubscriptionTier;
    label: string;
    description: string;
}
export declare const TIER_LIMITS: Record<SubscriptionTier, TierLimits>;
export declare function tierAtLeast(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean;
export declare const FEATURE_GATES: FeatureGate[];
export declare function getGateForFeature(feature: string): FeatureGate | undefined;
export declare const TIER_DISPLAY: Record<SubscriptionTier, {
    label: string;
    icon: string;
    color: string;
}>;
//# sourceMappingURL=subscription.model.d.ts.map