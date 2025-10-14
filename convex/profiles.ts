import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    twitterId: v.string(),
    handle: v.string(),
    name: v.string(),
    bio: v.string(),
    followers: v.number(),
    following: v.number(),
    url: v.union(v.string(), v.null()),
    profileImageUrl: v.optional(v.string()),
    lastActiveAt: v.number(),
    lang: v.string(),
    dmOpen: v.union(v.boolean(), v.null()),
    verified: v.boolean(),
    discoveryBucket: v.optional(v.union(v.literal("creator"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_twitter_id", (q) => q.eq("twitterId", args.twitterId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("profiles", args);
  },
});

export const getByTwitterId = query({
  args: { twitterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_twitter_id", (q) => q.eq("twitterId", args.twitterId))
      .first();
  },
});

