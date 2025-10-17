import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// 10 keywords for variety
const CREATOR_KEYWORDS = ["building in public", "indie hacker", "solopreneur", "maker", "bootstrapped", "shipped", "launched", "founder", "startup founder", "side project"];
const USER_KEYWORDS = ["subscription", "Netflix", "Spotify", "Disney+", "monthly payment", "cancel subscription", "forgot to cancel", "recurring charge", "auto renew", "subscription cost"];

// Map keywords to DM template indices
const CREATOR_KEYWORD_TO_TEMPLATE: Record<string, number> = {
  "building in public": 0,
  "shipped": 0,
  "launched": 0,
  "indie hacker": 1,
  "solopreneur": 1,
  "bootstrapped": 1,
  "founder": 1,
  "maker": 2,
  "side project": 2,
  "startup founder": 2,
};

const USER_KEYWORD_TO_TEMPLATE: Record<string, number> = {
  "cancel subscription": 0,
  "forgot to cancel": 0,
  "recurring charge": 0,
  "auto renew": 0,
  "Netflix": 1,
  "Spotify": 1,
  "Disney+": 1,
  "subscription": 2,
  "monthly payment": 2,
  "subscription cost": 2,
};

const CREATOR_DM_TEMPLATES = [
  "Hey! I'm sharing my SaaS journey in public and trying to connect with others building out loud. If my posts ever align with what you like to share, would you be open to RT'ing them sometimes? I'd really appreciate it.",
  "Hey! I'm an indie hacker building my SaaS in public and sharing the progress here. If you're open to it, I'd love for you to RT my posts sometimes as I keep shipping—trying to grow alongside other builders.",
  "Hey! I'm working on a small startup project and sharing progress publicly. Would you be okay if I looped you in on some of my posts from time to time? Always trying to learn from and connect with other makers.",
];

const USER_DM_TEMPLATES = [
  "Hey! I've been working on a free app that helps you stay on top of renewals and avoid those surprise subscription charges. It's called SubWise — https://usesubwise.app/ — if that sounds useful, I'd love for you to try it and tell me what you think.",
  "Hey! I built a free app called SubWise that keeps track of things like Netflix, Spotify, Disney+, and other renewals in one place. If you'd be open to giving it a quick spin — https://usesubwise.app/ — your feedback would really help me improve it.",
  "Hey! I'm building SubWise — a free tool that organizes all your subscriptions and reminds you before they renew. If you're open to checking it out, here's the link: https://usesubwise.app/ — I'd love any thoughts or feedback you have.",
];

export const findCreators = action({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    "use node";

    console.log(`🔍 Finding ${args.count} creators...`);

    const { searchUserByKeyword } = await import("../lib/twitter-client");
    const apiKey = process.env.TWITTER_API_KEY || "";

    // Search all keywords with limited results per keyword for variety
    const allCreators: Array<{ data: any; keyword: string }> = [];
    for (const query of CREATOR_KEYWORDS) {
      const results = await searchUserByKeyword(query, 3, apiKey);
      allCreators.push(...results.map(r => ({ data: r, keyword: query })));
    }

    // Remove duplicates (keep first occurrence with its keyword)
    const uniqueCreators = Array.from(
      new Map(allCreators.map(c => [c.data.id, c])).values()
    );

    console.log(`Found ${uniqueCreators.length} potential creators across ${CREATOR_KEYWORDS.length} keywords`);

    const results = [];

    for (const creator of uniqueCreators) {
      const c = creator.data;
      console.log(`Checking @${c.userName}: bio=${c.description?.length || 0} chars, followers=${c.followers || 0}`);

      // Minimal filters only
      if (!c.description || c.description.trim().length < 10) {
        console.log(`  ✗ No bio`);
        continue;
      }
      if (!c.followers || c.followers < 500) {
        console.log(`  ✗ Too few followers`);
        continue;
      }

      const profileId = await ctx.runMutation(api.profiles.upsert, {
        twitterId: c.id,
        handle: c.userName,
        name: c.name,
        bio: c.description,
        followers: c.followers,
        following: c.following || 0,
        url: c.url || null,
        profileImageUrl: c.profilePicture || undefined,
        lastActiveAt: Date.now(),
        lang: "en",
        dmOpen: c.canDm || null,
        verified: c.isBlueVerified || false,
        discoveryBucket: "creator",
      });

      // Skip if this profile has been queued before
      const alreadyQueued = await ctx.runQuery(api.candidates.hasProfileBeenQueued, { profileId });
      if (alreadyQueued) {
        console.log(`  ✗ Already queued before - skipping @${c.userName}`);
        continue;
      }

      console.log(`  ✓ ACCEPTED @${c.userName} (${c.followers} followers, keyword: ${creator.keyword})`);

      // Get DM template based on keyword
      const templateIndex = CREATOR_KEYWORD_TO_TEMPLATE[creator.keyword] || 0;
      const dmText = CREATOR_DM_TEMPLATES[templateIndex];

      await ctx.runMutation(api.candidates.bulkInsert, {
        candidates: [{
          profileId,
          bucket: "collab",
          score: 8,
          rationale: `${creator.keyword} search`,
          dmDraft: dmText,
          icebreaker: creator.keyword,
          queuedFor: new Date().toISOString().split('T')[0],
        }],
      });

      results.push({ handle: c.userName, followers: c.followers });
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
    const apiKey = process.env.TWITTER_API_KEY || "";

    // Search all keywords with limited results per keyword for variety
    const allTweetsWithKeywords: Array<{ tweets: any[]; keyword: string }> = [];
    for (const query of USER_KEYWORDS) {
      const results = await searchTweets(query, 3, apiKey);
      allTweetsWithKeywords.push({ tweets: results, keyword: query });
    }

    // Extract users and track which keyword found them
    const usersWithKeywords: Array<{ user: any; keyword: string }> = [];
    for (const { tweets, keyword } of allTweetsWithKeywords) {
      const users = extractUniqueUsers(tweets);
      usersWithKeywords.push(...users.map(u => ({ user: u, keyword })));
    }

    // Remove duplicates (keep first occurrence with its keyword)
    const uniqueUsers = Array.from(
      new Map(usersWithKeywords.map(u => [u.user.id, u])).values()
    );

    console.log(`Found ${uniqueUsers.length} potential users across ${USER_KEYWORDS.length} keywords`);

    const results = [];

    for (const { user, keyword } of uniqueUsers) {
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

      // Skip if this profile has been queued before
      const alreadyQueued = await ctx.runQuery(api.candidates.hasProfileBeenQueued, { profileId });
      if (alreadyQueued) {
        console.log(`  ✗ Already queued before - skipping @${user.userName}`);
        continue;
      }

      console.log(`  ✓ ACCEPTED @${user.userName} (${user.followers || 0} followers, keyword: ${keyword})`);

      // Get DM template based on keyword
      const templateIndex = USER_KEYWORD_TO_TEMPLATE[keyword] || 2;
      const dmText = USER_DM_TEMPLATES[templateIndex];

      await ctx.runMutation(api.candidates.bulkInsert, {
        candidates: [{
          profileId,
          bucket: "user",
          score: 5,
          rationale: `${keyword} search`,
          dmDraft: dmText,
          icebreaker: keyword,
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

    // Clear old queued candidates before finding new ones
    console.log(`🗑️  Clearing old queued candidates...`);
    const cleared = await ctx.runMutation(api.candidates.clearQueued, {});
    console.log(`   Deleted ${cleared.deleted} old candidates`);

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

export const runCreatorPipelineOnly = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";

    console.log(`🎯 Starting CREATOR pipeline only...`);

    // Clear only creator queued candidates
    console.log(`🗑️  Clearing queued creators...`);
    const cleared = await ctx.runMutation(api.candidates.clearQueued, { bucket: "collab" });
    console.log(`   Deleted ${cleared.deleted} old creator candidates`);

    const creators = await ctx.runAction(api.daily.findCreators, { count: 10 });

    console.log(`\n✅ CREATOR PIPELINE COMPLETE`);
    console.log(`- Creators: ${creators.count}/10`);

    return {
      success: true,
      creators: creators.count,
      users: 0,
      total: creators.count,
    };
  },
});

export const runUserPipelineOnly = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";

    console.log(`💼 Starting USER pipeline only...`);

    // Clear only user queued candidates
    console.log(`🗑️  Clearing queued users...`);
    const cleared = await ctx.runMutation(api.candidates.clearQueued, { bucket: "user" });
    console.log(`   Deleted ${cleared.deleted} old user candidates`);

    const users = await ctx.runAction(api.daily.findUsers, { count: 20 });

    console.log(`\n✅ USER PIPELINE COMPLETE`);
    console.log(`- Users: ${users.count}/20`);

    return {
      success: true,
      creators: 0,
      users: users.count,
      total: users.count,
    };
  },
});
