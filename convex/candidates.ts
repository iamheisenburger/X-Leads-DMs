import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const bulkInsert = mutation({
  args: {
    candidates: v.array(
      v.object({
        profileId: v.id("profiles"),
        bucket: v.union(v.literal("user"), v.literal("collab")),
        score: v.number(),
        rationale: v.string(),
        icebreaker: v.string(),
        dmDraft: v.string(),
        queuedFor: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const candidate of args.candidates) {
      await ctx.db.insert("candidates", {
        ...candidate,
        status: "queued",
      });
    }
    return { inserted: args.candidates.length };
  },
});

export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("candidates")
      .withIndex("by_queued_for", (q) => q.eq("queuedFor", today))
      .collect();
  },
});

export const getSentByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .filter((q) =>
        q.and(
          q.gte(q.field("queuedFor"), args.startDate),
          q.lte(q.field("queuedFor"), args.endDate),
          q.eq(q.field("status"), "sent")
        )
      )
      .collect();

    // Group by date and attach profile data
    const grouped: Record<string, any[]> = {};

    for (const candidate of candidates) {
      const profile = await ctx.db.get(candidate.profileId);
      const date = candidate.queuedFor;

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push({
        ...candidate,
        profile,
        sentAt: candidate._creationTime,
      });
    }

    return grouped;
  },
});

export const deleteSentDM = mutation({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.candidateId);
    return { success: true };
  },
});

export const deleteAllSentForDate = mutation({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_queued_for", (q) => q.eq("queuedFor", args.date))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    for (const candidate of candidates) {
      await ctx.db.delete(candidate._id);
    }

    return { deleted: candidates.length };
  },
});

export const skip = mutation({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      status: "skipped",
    });
    return { success: true };
  },
});

export const markSent = mutation({
  args: {
    candidateId: v.id("candidates"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      status: "sent",
    });
    return { success: true };
  },
});

export const getDMCountForProfile = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const count = await ctx.db
      .query("candidates")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.eq(q.field("status"), "sent"))
      .collect();

    return count.length;
  },
});

