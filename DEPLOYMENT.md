# Deployment Guide

## Prerequisites

- GitHub repository: https://github.com/iamheisenburger/X-Dm-Tool.git
- Vercel account: https://vercel.com
- Convex account: https://convex.dev
- Twitter API key from twitterapi.io
- Anthropic API key

## Step 1: Set Up Convex

1. Install Convex CLI globally (if not already installed):
```bash
npm install -g convex
```

2. Navigate to project directory:
```bash
cd "C:\Users\arshadhakim\OneDrive\Desktop\X Dm Hub"
```

3. Initialize Convex (creates deployment):
```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex
- Create a new project (or link existing)
- Generate deployment URL
- Create `.env.local` with:
  - `CONVEX_DEPLOYMENT`
  - `NEXT_PUBLIC_CONVEX_URL`

4. Deploy schema and functions:
```bash
npx convex deploy --prod
```

## Step 2: Configure Environment Variables

Create `.env.local` file with:

```bash
# Twitter API (get from twitterapi.io)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_BASE_URL=https://api.twitterapi.io/v1

# Anthropic Claude (get from console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Convex (auto-generated from step 1)
CONVEX_DEPLOYMENT=prod:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Step 3: Test Locally

1. Run development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Go to Settings page and verify config loads

4. (Optional) Manually trigger pipeline to test:
```bash
npx convex run pipeline:runManual
```

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow prompts:
   - Link to existing project or create new
   - Confirm settings
   - Deploy

4. Set environment variables in Vercel dashboard:
   - Go to: https://vercel.com/[your-username]/x-dm-hub/settings/environment-variables
   - Add:
     - `TWITTER_API_KEY`
     - `TWITTER_API_BASE_URL`
     - `ANTHROPIC_API_KEY`
     - `NEXT_PUBLIC_CONVEX_URL` (from Convex)
     - `CONVEX_DEPLOYMENT` (from Convex)

5. Redeploy:
```bash
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new

2. Import Git Repository:
   - Connect GitHub account (if not already)
   - Select: `iamheisenburger/X-Dm-Tool`
   - Click "Import"

3. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. Add Environment Variables:
   - `TWITTER_API_KEY` (from twitterapi.io)
   - `TWITTER_API_BASE_URL` = `https://api.twitterapi.io/v1`
   - `ANTHROPIC_API_KEY` (from console.anthropic.com)
   - `NEXT_PUBLIC_CONVEX_URL` (from Convex dashboard)
   - `CONVEX_DEPLOYMENT` (from Convex dashboard)

5. Click "Deploy"

## Step 5: Initialize Configuration

1. After deployment, visit your site: https://x-dm-hub.vercel.app

2. Go to Settings page

3. Verify default config loaded from `public/config.json`

4. Adjust settings as needed:
   - Cost mode (LEAN/STANDARD/AGGRESSIVE)
   - Search queries
   - Brand terms
   - Scoring weights

5. Click "Save Configuration"

## Step 6: Verify Cron Job

The daily pipeline is scheduled to run at 6:00 AM UTC via Convex crons.

To verify it's configured:

1. Go to Convex dashboard: https://dashboard.convex.dev

2. Select your project

3. Go to "Functions" → "Crons"

4. Verify "daily pipeline" is listed with schedule: `0 6 * * *`

## Step 7: Manual Test Run

Trigger the pipeline manually to verify everything works:

```bash
# Via Convex CLI
npx convex run pipeline:runManual

# Or via Convex dashboard
# Go to Functions → Actions → pipeline:runManual → Run
```

Check the logs for:
- Discovery: X profiles found
- Enrichment: Profiles classified
- Scoring: Candidates generated

## Step 8: Monitor & Iterate

### Check Dashboard
- Visit your deployed site
- Review today's queue
- Test candidate card actions (Copy, Open DM, Mark Sent)

### Export CSV
- Test CSV export: `https://your-site.vercel.app/export/today.csv`

### Review Costs
- Twitter API: https://twitterapi.io/dashboard
- Anthropic: https://console.anthropic.com/settings/billing

### Adjust Settings
- If queue is too small: increase cost mode or adjust queries
- If queue is too large: decrease cost mode or tighten filters
- If candidates are low quality: adjust scoring weights

## Troubleshooting

### Issue: Convex functions not found
**Solution:** Run `npx convex deploy --prod` to deploy functions

### Issue: "No data found" on dashboard
**Solution:**
1. Run pipeline manually: `npx convex run pipeline:runManual`
2. Check Convex logs for errors
3. Verify API keys are set correctly

### Issue: Twitter API rate limits
**Solution:**
1. Reduce cost mode (AGGRESSIVE → STANDARD → LEAN)
2. Increase delays in `discover.ts` and `enrich.ts`

### Issue: Claude API errors
**Solution:**
1. Check API key is valid
2. Verify billing is set up
3. Check Anthropic dashboard for rate limits

### Issue: CSV export 404
**Solution:**
1. Ensure HTTP routes are deployed: `npx convex deploy --prod`
2. Check route path matches: `/export/today.csv`

## Production Checklist

- [ ] Convex deployed to production
- [ ] Environment variables set in Vercel
- [ ] Default config loaded and customized
- [ ] Manual pipeline run successful
- [ ] Dashboard displays candidates correctly
- [ ] CSV export works
- [ ] Cron job scheduled (6am UTC)
- [ ] API costs monitored
- [ ] Twitter API key has sufficient credits
- [ ] Anthropic API billing configured

## Next Steps

1. **Monitor First Week**
   - Track daily queue quality
   - Measure DM → Reply conversion
   - Adjust scoring weights based on outcomes

2. **Optimize Queries**
   - Add/remove search terms based on results
   - Test different brand terms
   - Experiment with niche targeting

3. **Scale Up**
   - If conversion is good, increase cost mode
   - Add more suppression rules (e.g., already contacted)
   - Build analytics dashboard for long-term tracking

4. **Iterate on Prompts**
   - Refine Claude classification prompt for better signal detection
   - A/B test DM generation styles
   - Add persona-specific templates

## Support

- **Convex Docs**: https://docs.convex.dev
- **Vercel Docs**: https://vercel.com/docs
- **Twitter API Docs**: https://twitterapi.io/docs
- **Anthropic Docs**: https://docs.anthropic.com

## Repository

https://github.com/iamheisenburger/X-Dm-Tool

Questions or issues? Open an issue on GitHub.
