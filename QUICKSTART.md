# Quick Start Guide

Get X DM Hub running in 10 minutes.

## 1. Clone & Install (2 min)

```bash
git clone https://github.com/iamheisenburger/X-Dm-Tool.git
cd X-Dm-Tool
npm install
```

## 2. Set Up Convex (3 min)

```bash
# Initialize Convex
npx convex dev
```

Follow prompts to:
1. Log in to Convex (creates account if needed)
2. Create new project
3. Convex will generate `.env.local` with URLs

## 3. Add API Keys (2 min)

Edit `.env.local` and add your keys:

```bash
# Get from twitterapi.io (requires sign-up)
TWITTER_API_KEY=your_key_here
TWITTER_API_BASE_URL=https://api.twitterapi.io/v1

# Get from console.anthropic.com (requires sign-up)
ANTHROPIC_API_KEY=your_key_here

# Already set by Convex (don't change)
CONVEX_DEPLOYMENT=prod:...
NEXT_PUBLIC_CONVEX_URL=https://...
```

### Getting API Keys

**Twitter API (twitterapi.io)**
1. Go to https://twitterapi.io
2. Sign up for free account
3. Add payment method (pay-as-you-go)
4. Copy API key from dashboard
5. Estimated cost: ~$14/mo for STANDARD mode

**Anthropic API**
1. Go to https://console.anthropic.com
2. Sign up for account
3. Add payment method
4. Go to Settings → API Keys
5. Create new key
6. Estimated cost: ~$4/mo for STANDARD mode

## 4. Initialize Config (1 min)

The default config in `public/config.json` is ready to use. You can customize later via Settings page.

## 5. Run Locally (1 min)

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
npm run dev
```

Open http://localhost:3000

## 6. Test Pipeline (1 min)

### Option A: Via Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to Functions → Actions
4. Find `pipeline:runManual`
5. Click "Run"

### Option B: Via CLI
```bash
npx convex run pipeline:runManual
```

Watch the logs for:
- ✓ Discovery: X profiles found
- ✓ Enrichment: Profiles classified
- ✓ Scoring: Candidates generated

## 7. View Results

Refresh http://localhost:3000

You should see:
- **Collab Creators** column (up to 10)
- **SubWise Users** column (up to 20)

Each card shows:
- Profile info
- Why they were selected
- AI-generated DM
- Action buttons (Copy, Open DM, Send, etc.)

## What's Next?

### Customize Settings
1. Go to http://localhost:3000/settings
2. Adjust:
   - Search queries (add your niche keywords)
   - Brand terms (subscription services you want to target)
   - Scoring weights (tune for your ideal candidates)
   - Cost mode (LEAN/STANDARD/AGGRESSIVE)

### Deploy to Production
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

Quick deploy with Vercel:
```bash
npx vercel
```

### Schedule Daily Pipeline
The cron job is already configured to run at 6:00 AM UTC.

To change schedule, edit `convex/crons.ts`:
```ts
crons.daily(
  "daily pipeline",
  { hourUTC: 6, minuteUTC: 0 }, // Change this
  api.pipeline.runDailyPipeline
);
```

Then redeploy:
```bash
npx convex deploy --prod
```

## Troubleshooting

### "Convex functions not found"
Run: `npx convex deploy`

### "No candidates showing"
1. Check API keys are valid
2. Run pipeline manually (step 6)
3. Check Convex logs for errors

### "TypeError: Cannot read property..."
Make sure both Convex dev and Next.js dev servers are running.

### Cost concerns?
Start with LEAN mode (~$7/mo):
```json
{
  "costMode": "LEAN"
}
```

## Daily Workflow

Once deployed, your daily workflow is:

1. **Morning** (6:30am): Check dashboard for new queue
2. **Review** (10 min): Skim through 30 candidates
3. **Reach Out** (20 min): Copy DMs → Send on X
4. **Track** (5 min): Mark as sent, snooze, or skip
5. **Monitor** (ongoing): Check for replies throughout day

## Support

- **Issues**: https://github.com/iamheisenburger/X-Dm-Tool/issues
- **Docs**: See [README.md](./README.md) for detailed info
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

Happy lead hunting! 🚀
