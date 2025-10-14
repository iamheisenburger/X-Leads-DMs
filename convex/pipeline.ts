import { action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Manual pipeline runner - triggered from the UI
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
