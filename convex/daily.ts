import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const findCreators = action({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    "use node";

    console.log(`🔍 Finding ${args.count} creators...`);

    const { searchUserByKeyword } = await import("../lib/twitter-client");
    const apiKey = process.env.TWITTER_API_KEY || "";

    const creators = await searchUserByKeyword("indie hacker", args.count * 3, apiKey);
    console.log(`Found ${creators.length} potential creators`);

    const results = [];

    for (const creator of creators) {
      // Debug logging
      console.log(`Checking @${creator.userName}: bio=${creator.description?.length || 0} chars, followers=${creator.followers || 0}, tweets=${creator.statusesCount || 0}`);

      // Relaxed filters
      if (!creator.description || creator.description.trim().length < 10) {
        console.log(`  ✗ No bio`);
        continue;
      }
      if (!creator.followers || creator.followers < 500) {
        console.log(`  ✗ Too few followers`);
        continue;
      }
      // Removed statusesCount check - not reliable from user search API

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

      const dmText = `Hey! I'm also building in public and post content you might relate to. Want to support each other with RTs when we ship?`;

      await ctx.runMutation(api.candidates.bulkInsert, {
        candidates: [{
          profileId,
          bucket: "collab",
          score: 8,
          rationale: "Indie hacker keyword search",
          dmDraft: dmText,
          icebreaker: "indie hacker",
          queuedFor: new Date().toISOString().split('T')[0],
        }],
      });

      results.push({ handle: creator.userName, followers: creator.followers });
    }

    console.log(`✅ ${results.length} creators ready (searched for ${args.count}, accepted all qualified)`);
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

    const tweets = await searchTweets("subscriptions OR Netflix OR Spotify", args.count * 3, apiKey);
    const users = extractUniqueUsers(tweets);
    console.log(`Found ${users.length} potential users`);

    const results = [];

    for (const user of users) {
      // Debug logging
      console.log(`Checking @${user.userName}: followers=${user.followers || 0}, tweets=${user.statusesCount || 0}`);

      if (!user.followers || user.followers > 100000) {
        console.log(`  ✗ Followers out of range (need 1-100k)`);
        continue;
      }
      if (!user.statusesCount || user.statusesCount < 5) {
        console.log(`  ✗ Too few tweets (need 5+)`);
        continue;
      }

      console.log(`  ✓ ACCEPTED @${user.userName} (${user.followers} followers)`);

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

      const dmText = `Hey! Built a free tracker that catches forgotten subs before they renew. Want to check it out?`;

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

    console.log(`✅ ${results.length} users ready (searched for ${args.count}, accepted all qualified)`);
    return { success: true, count: results.length };
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

