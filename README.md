# X DM Hub

A daily lead finder that discovers and qualifies two types of prospects on X (Twitter):
1. **Collab Creators** (10/day) - Amplifiers who spotlight small builders
2. **SubWise Users** (20/day) - Potential users for a subscription tracking SaaS

## Features

- **Automated Discovery**: Twitter API searches with smart batching
- **AI Classification**: Claude Haiku classifies profiles into collab/user buckets
- **Intelligent Scoring**: Custom scoring algorithms for each bucket
- **DM Generation**: Claude Sonnet writes personalized 2-sentence DMs
- **Human-in-the-loop UI**: Review, approve, skip, or snooze candidates
- **Daily Pipeline**: Scheduled cron job runs at 6am UTC
- **Cost-aware**: LEAN ($7/mo), STANDARD ($14/mo), AGGRESSIVE ($35/mo) modes

## Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time DB + serverless functions)
- **APIs**: twitterapi.io (X data) + Anthropic Claude (AI)
- **Hosting**: Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to existing)
- Generate `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex dev server

### 3. Configure Environment Variables

Create `.env.local` with:

```bash
# Twitter API (twitterapi.io)
TWITTER_API_KEY=your_key_here
TWITTER_API_BASE_URL=https://api.twitterapi.io/v1

# Anthropic Claude
ANTHROPIC_API_KEY=your_key_here

# Convex (auto-generated)
CONVEX_DEPLOYMENT=your_deployment
NEXT_PUBLIC_CONVEX_URL=your_url
```

### 4. Initialize Configuration

On first run, the app will use default config from `public/config.json`. You can edit this via the Settings page.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Dashboard

View today's queue of candidates:
- **Collab Creators**: Amplifiers to reach out to for RTs/QTs
- **SubWise Users**: Potential customers for SubWise

Each card shows:
- Profile info (avatar, handle, followers, bio)
- Evidence/rationale
- AI-generated icebreaker + DM
- Actions: Copy, Open DM, Mark Sent, Skip, Snooze

### Settings

Configure:
- **Queries**: Search terms for each bucket
- **Brand Terms**: Subscription services to detect
- **Weights**: Scoring weights for collab/user signals
- **Cost Mode**: LEAN, STANDARD, or AGGRESSIVE
- **Daily Targets**: How many of each bucket (default: 10 collab, 20 users)

### CSV Export

Download today's queue:
```
GET /export/today.csv
```

Download specific date:
```
GET /export/2025-10-13.csv
```

## Pipeline

The daily pipeline runs automatically at 6:00 AM UTC:

1. **Discovery** (Twitter API)
   - Run search queries for collab + user buckets
   - Batch requests (50-100 results per call)
   - Store profiles in database

2. **Enrichment** (Claude Haiku)
   - Fetch last 5 tweets for each profile
   - Classify with AI (collab_creator vs potential_user)
   - Extract signals (brands, pain points, amplifier behavior)

3. **Scoring** (Heuristics)
   - Compute scores based on weights
   - Filter by follower band (collab only)
   - Dedupe against suppression list
   - Select top N

4. **DM Generation** (Claude Sonnet)
   - Generate personalized DMs for top 30 candidates
   - Store in candidates table as "queued"

## Cost Estimates

### STANDARD Mode (~$18/mo total)

**Twitter API** (~$14/mo):
- 600 search results/day × $0.00015 = $0.09
- 400 profile lookups/day × $0.00018 = $0.072
- 2000 timeline tweets/day × $0.00015 = $0.30
- **Total: $0.462/day = $13.86/mo**

**Anthropic API** (~$4/mo):
- Haiku: 100 profiles × 500 tokens × $0.001/1M = $0.05/day
- Sonnet: 30 DMs × 1000 tokens × $0.003/1M = $0.09/day
- **Total: $0.14/day = $4.20/mo**

## Project Structure

```
X Dm Hub/
├── app/                       # Next.js pages
│   ├── page.tsx              # Dashboard
│   ├── settings/page.tsx     # Config editor
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── candidate-card.tsx    # Profile card with DM
│   ├── queue-column.tsx      # Column of candidates
│   └── metrics-strip.tsx     # Stats banner
├── convex/                   # Convex backend
│   ├── schema.ts             # Database schema
│   ├── discover.ts           # Twitter searches
│   ├── enrich.ts             # Claude classification
│   ├── score.ts              # Scoring + DM gen
│   ├── pipeline.ts           # Orchestrator
│   ├── crons.ts              # Scheduled jobs
│   └── http.ts               # CSV export
├── lib/                      # Utilities
│   ├── twitter-client.ts     # Twitter API wrapper
│   ├── claude-client.ts      # Anthropic SDK wrapper
│   ├── prompts.ts            # LLM prompts
│   ├── scoring.ts            # Score calculators
│   └── config.ts             # Config types
└── public/
    └── config.json           # Default config
```

## Deployment

### Vercel

1. Push to GitHub:
```bash
git init
git remote add origin https://github.com/iamheisenburger/X-Dm-Tool.git
git add .
git commit -m "Initial commit"
git push -u origin master
```

2. Deploy to Vercel:
```bash
npx vercel
```

3. Set environment variables in Vercel dashboard:
   - `TWITTER_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_CONVEX_URL` (from Convex)
   - `CONVEX_DEPLOYMENT` (from Convex)

4. Deploy Convex to production:
```bash
npx convex deploy
```

## License

MIT
