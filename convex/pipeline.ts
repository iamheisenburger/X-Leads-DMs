import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Manual pipeline runner - triggered from the UI (full refresh)
 */
export const runManual = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";

    console.log(`🚀 Manual pipeline started...`);

    // Run the daily lead finder
    const result = await ctx.runAction(api.daily.runDaily);

    console.log(`✅ Pipeline complete: ${result.total} leads found`);

    return result;
  },
});

/**
 * Manual creator pipeline runner - only refreshes creator leads
 */
export const runManualCreators = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";

    console.log(`🎯 Manual CREATOR pipeline started...`);

    // Run only the creator pipeline
    const result = await ctx.runAction(api.daily.runCreatorPipelineOnly);

    console.log(`✅ Creator pipeline complete: ${result.creators} creators found`);

    return result;
  },
});

/**
 * Manual user pipeline runner - only refreshes user leads
 */
export const runManualUsers = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; creators: number; users: number; total: number }> => {
    "use node";

    console.log(`💼 Manual USER pipeline started...`);

    // Run only the user pipeline
    const result = await ctx.runAction(api.daily.runUserPipelineOnly);

    console.log(`✅ User pipeline complete: ${result.users} users found`);

    return result;
  },
});
