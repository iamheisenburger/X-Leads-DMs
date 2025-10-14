/**
 * Scoring logic for collab and user candidates
 */

import type { AppConfig } from "./config";

export interface AmplifierSignals {
  rtSmallRatio: number;
  qtSmallRatio: number;
  repliesToSmallLast7d: boolean;
  bioTerms: string[];
}

export interface UserSignals {
  painPoints: string[];
  brands: string[];
  niches: string[];
}

/**
 * Calculate amplifier score for collab bucket
 */
export function calculateAmplifierScore(
  signals: AmplifierSignals,
  weights: AppConfig["collabWeights"]
): number {
  const bioTermsScore = signals.bioTerms.length > 0 ? weights.bioTerms : 0;
  const replyScore = signals.repliesToSmallLast7d ? weights.replyRateSmall : 0;

  return (
    signals.rtSmallRatio * weights.rtSmall +
    signals.qtSmallRatio * weights.qtSmall +
    bioTermsScore +
    replyScore
  );
}

/**
 * Calculate accessibility score for collab bucket
 */
export function calculateAccessibilityScore(
  signals: AmplifierSignals,
  dmOpen: boolean | null,
  weights: AppConfig["collabWeights"]
): number {
  const dmOpenScore = dmOpen === true ? weights.dmOpen : 0;
  const replyScore = signals.repliesToSmallLast7d ? 1 : 0;
  // Could add "runs share threads" detection here

  return dmOpenScore + replyScore;
}

/**
 * Calculate composite collab score
 */
export function calculateCollabScore(
  signals: AmplifierSignals,
  dmOpen: boolean | null,
  weights: AppConfig["collabWeights"]
): number {
  const amplifierScore = calculateAmplifierScore(signals, weights);
  const accessibilityScore = calculateAccessibilityScore(signals, dmOpen, weights);

  // Weighted combo: 70% amplifier, 30% accessibility
  return amplifierScore * 0.7 + accessibilityScore * 0.3;
}

/**
 * Calculate intent score for user bucket
 */
export function calculateUserScore(
  signals: UserSignals,
  lastTweetDaysAgo: number,
  weights: AppConfig["userWeights"]
): number {
  // Brand signal (has mentions of subscription services)
  const brandScore = signals.brands.length > 0 ? weights.brand : 0;

  // Pain signal (complaints or budget intent)
  const painScore = signals.painPoints.length > 0 ? weights.pain : 0;

  // Activity signal (recent tweets)
  const activityScore = lastTweetDaysAgo <= 14 ? weights.activity : 0;

  // Fit signal (matches ICP niches)
  const fitScore = signals.niches.length > 0 ? weights.fit : 0;

  return brandScore + painScore + activityScore + fitScore;
}

/**
 * Check if profile passes follower band filter (for collab)
 */
export function passesFollowerBand(
  followers: number,
  band: { min: number; max: number }
): boolean {
  return followers >= band.min && followers <= band.max;
}

/**
 * Check if profile is in suppression list
 */
export function isSuppressed(
  suppressions: Array<{ until: number | null }>,
  now: number
): boolean {
  return suppressions.some((s) => {
    // Permanent blacklist
    if (s.until === null) return true;
    // Timed snooze
    return s.until > now;
  });
}

/**
 * Dedupe candidates (keep highest score)
 */
export function dedupeByScore<T extends { score: number }>(
  candidates: T[],
  key: (item: T) => string
): T[] {
  const map = new Map<string, T>();

  for (const candidate of candidates) {
    const k = key(candidate);
    const existing = map.get(k);

    if (!existing || candidate.score > existing.score) {
      map.set(k, candidate);
    }
  }

  return Array.from(map.values());
}

/**
 * Sort and take top N
 */
export function topN<T>(items: T[], n: number, scoreFunc: (item: T) => number): T[] {
  return items.sort((a, b) => scoreFunc(b) - scoreFunc(a)).slice(0, n);
}
