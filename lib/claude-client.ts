/**
 * Claude API Client (Anthropic)
 * Uses Haiku for classification and Sonnet for DM generation
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  CLASSIFIER_SYSTEM_PROMPT,
  DM_GENERATOR_SYSTEM_PROMPT,
  buildClassifierPrompt,
  buildDmGeneratorPrompt,
} from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface ClassificationResult {
  is_collab_creator: boolean;
  is_potential_user: boolean;
  amplifier_signals: {
    rt_small_ratio: number;
    qt_small_ratio: number;
    replies_to_small_last7d: boolean;
  } | null;
  dm_open: boolean | null;
  pain_points: string[];
  brands: string[];
  niches: string[];
  reason: string;
}

export interface DmGenerationResult {
  icebreaker: string;
  dm: string;
}

/**
 * Classify a profile using Claude Haiku (fast + cheap)
 */
export async function classifyProfile(
  profile: {
    username: string;
    name: string;
    description?: string;
    followers_count?: number;
    url?: string;
  },
  recentTweets: Array<{ text: string; created_at: string }>,
  timelineInsights?: {
    painPoints: string[];
    tools: string[];
    interests: string[];
    isActive: boolean;
    complaintCount: number;
  }
): Promise<ClassificationResult | null> {
  try {
    const userPrompt = buildClassifierPrompt(profile, recentTweets, timelineInsights);

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: CLASSIFIER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") return null;

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from Claude response");
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as ClassificationResult;
    return result;
  } catch (error) {
    console.error("Error classifying profile:", error);
    return null;
  }
}

/**
 * Generate DM using Claude Sonnet (better quality)
 */
export async function generateDm(
  profile: {
    name: string;
    handle: string;
  },
  bucket: "collab" | "user",
  reason: string,
  timelineSummary?: string,
  tweetSnippet?: string
): Promise<DmGenerationResult | null> {
  try {
    const userPrompt = buildDmGeneratorPrompt(profile, bucket, reason, timelineSummary, tweetSnippet);

    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 512,
      system: DM_GENERATOR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") return null;

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from Claude response");
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as DmGenerationResult;
    return result;
  } catch (error) {
    console.error("Error generating DM:", error);
    return null;
  }
}

/**
 * Batch classify multiple profiles
 */
export async function classifyProfilesBatch(
  profiles: Array<{
    username: string;
    name: string;
    description?: string;
    followers_count?: number;
    url?: string;
    tweets: Array<{ text: string; created_at: string }>;
  }>
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();

  for (const profile of profiles) {
    const result = await classifyProfile(profile, profile.tweets);
    if (result) {
      results.set(profile.username, result);
    }

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
