import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// 10 keywords for variety
const CREATOR_KEYWORDS = ["building in public", "indie hacker", "solopreneur", "maker", "bootstrapped", "shipped", "launched", "founder", "startup founder", "side project"];
const USER_KEYWORDS = ["subscription", "Netflix", "Spotify", "Disney+", "monthly payment", "cancel subscription", "forgot to cancel", "recurring charge", "auto renew", "subscription cost"];

export const findCreators = action({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    "use node";

    console.log(`🔍 Finding ${args.count} creators...`);

    const { searchUserByKeyword } = await import("../lib/twitter-client");
    const { generatePersonalizedDM } = await import("../lib/claude-client");
    const apiKey = process.env.TWITTER_API_KEY || "";

    // Use 5 keywords to balance variety and API costs
    const allCreators = [];
    for (const query of CREATOR_KEYWORDS.slice(0, 5)) {
      const results = await searchUserByKeyword(query, Math.ceil(args.count * 1.5), apiKey);
      allCreators.push(...results);
    }

    // Remove duplicates
    const uniqueCreators = Array.from(
      new Map(allCreators.map(c => [c.id, c])).values()
    );

    console.log(`Found ${uniqueCreators.length} potential creators`);

    const results = [];

    for (const creator of uniqueCreators) {
      console.log(`Checking @${creator.userName}: bio=${creator.description?.length || 0} chars, followers=${creator.followers || 0}`);

      // Minimal filters only
      if (!creator.description || creator.description.trim().length < 10) {
        console.log(`  ✗ No bio`);
        continue;
      }
      if (!creator.followers || creator.followers < 500) {
        console.log(`  ✗ Too few followers`);
        continue;
      }

      console.log(`  ✓ ACCEPTED @${creator.userName} (${creator.followers} followers)`);

      const profileId = await ctx.runMutation(api.profiles.upsert, {
        twitterId: creator.id,
        handle: creator.userName,
        name: creator.name,
        bio: creator.description,
        followers: creator.followers,
        following: creator.following || 0,
        url: creator.url || null,
        profileImageUrl: creator.profilePicture || undefined,
        lastActiveAt: Date.now(),
        lang: "en",
        dmOpen: creator.canDm || null,
        verified: creator.isBlueVerified || false,
        discoveryBucket: "creator",
      });

      // Generate personalized DM with Claude Haiku
      const dmText = await generatePersonalizedDM(
        { name: creator.name, handle: creator.userName, bio: creator.description, followers: creator.followers },
        "creator"
      );

      await ctx.runMutation(api.candidates.bulkInsert, {
        candidates: [{
          profileId,
          bucket: "collab",
          score: 8,
          rationale: "Building-in-public creator search",
          dmDraft: dmText,
          icebreaker: "building in public",
          queuedFor: new Date().toISOString().split('T')[0],
        }],
      });

      results.push({ handle: creator.userName, followers: creator.followers });
    }

    console.log(`✅ ${results.length} creators ready`);
    return { success: true, count: results.length };
  },
});

export const findUsers = action({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    "use node";

    console.log(`🔍 Finding ${args.count} users...`);

    const { searchTweets, extractUniqueUsers } = await import("../lib/twitter-client");
    const { generatePersonalizedDM } = await import("../lib/claude-client");
    const apiKey = process.env.TWITTER_API_KEY || "";

    // Use 5 keywords
    const allTweets = [];
    for (const query of USER_KEYWORDS.slice(0, 5)) {
      const results = await searchTweets(query, Math.ceil(args.count * 1.5), apiKey);
      allTweets.push(...results);
    }

    const users = extractUniqueUsers(allTweets);
    console.log(`Found ${users.length} potential users`);

    const results = [];

    for (const user of users) {
      console.log(`Checking @${user.userName}: followers=${user.followers || 0}, tweets=${user.statusesCount || 0}`);

      // Minimal filters only
      if (!user.followers || user.followers > 100000) {
        console.log(`  ✗ Followers out of range (need 1-100k)`);
        continue;
      }
      if (!user.statusesCount || user.statusesCount < 5) {
        console.log(`  ✗ Too few tweets (need 5+)`);
        continue;
      }

      console.log(`  ✓ ACCEPTED @${user.userName} (${user.followers || 0} followers)`);

      const profileId = await ctx.runMutation(api.profiles.upsert, {
        twitterId: user.id,
        handle: user.userName,
        name: user.name,
        bio: user.description || "",
        followers: user.followers || 0,
        following: user.following || 0,
        url: user.url || null,
        profileImageUrl: user.profilePicture || undefined,
        lastActiveAt: Date.now(),
        lang: "en",
        dmOpen: user.canDm || null,
        verified: user.isBlueVerified || false,
        discoveryBucket: "user",
      });

      // Generate personalized DM with Claude Haiku
      const dmText = await generatePersonalizedDM(
        { name: user.name, handle: user.userName, bio: user.description || "", followers: user.followers || 0 },
        "user"
      );

      await ctx.runMutation(api.candidates.bulkInsert, {
        candidates: [{
          profileId,
          bucket: "user",
          score: 5,
          rationale: "Subscription tweet search",
          dmDraft: dmText,
          icebreaker: "subscriptions",
          queuedFor: new Date().toISOString().split('T')[0],
        }],
      });

      results.push({ handle: user.userName, followers: user.followers || 0 });
    }

    console.log(`✅ ${results.length} users ready`);
    return { success: true, count: results.length };
  },
});

// Mini test function
export const miniTest = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";
    console.log(`🧪 MINI TEST: Finding 5 creators + 5 users...`);
    const creators = await ctx.runAction(api.daily.findCreators, { count: 5 });
    const users = await ctx.runAction(api.daily.findUsers, { count: 5 });
    console.log(`✅ MINI TEST COMPLETE - Creators: ${creators.count}/5, Users: ${users.count}/5`);
    return { success: true, creators: creators.count, users: users.count, total: creators.count + users.count };
  },
});

export const runDaily = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";

    console.log(`🚀 Starting daily lead finder...`);

    const creators = await ctx.runAction(api.daily.findCreators, { count: 10 });
    const users = await ctx.runAction(api.daily.findUsers, { count: 20 });

    console.log(`\n✅ COMPLETE`);
    console.log(`- Creators: ${creators.count}/10`);
    console.log(`- Users: ${users.count}/20`);

    return {
      success: true,
      creators: creators.count,
      users: users.count,
      total: creators.count + users.count,
    };
  },
});
