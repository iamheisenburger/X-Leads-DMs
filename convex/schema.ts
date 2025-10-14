import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
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
  })
    .index("by_twitter_id", ["twitterId"])
    .index("by_handle", ["handle"]),

  candidates: defineTable({
    profileId: v.id("profiles"),
    bucket: v.union(v.literal("user"), v.literal("collab")),
    score: v.number(),
    rationale: v.string(),
    icebreaker: v.string(),
    dmDraft: v.string(),
    queuedFor: v.string(),
    status: v.optional(v.string()),
  })
    .index("by_profile", ["profileId"])
    .index("by_queued_for", ["queuedFor"]),
});

