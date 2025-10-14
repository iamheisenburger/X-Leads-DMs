# Vercel Deployment Setup

## Environment Variables

Add these environment variables in Vercel Dashboard:

### Required Variables

```bash
# Twitter API (from twitterapi.io)
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_BASE_URL=https://api.twitterapi.io

# Anthropic Claude (from console.anthropic.com)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Convex (from Convex dashboard - PRODUCTION)
CONVEX_DEPLOYMENT=prod:resolute-mosquito-674
NEXT_PUBLIC_CONVEX_URL=https://resolute-mosquito-674.convex.cloud
```

## Build Settings

### Framework Preset
**Next.js**

### Root Directory
```
./
```

### Build Command
```
next build
```

### Output Directory
```
Next.js default
```

### Install Command
```
npm install
```
(or leave as default)

## Step-by-Step Deployment

### 1. Go to Vercel Dashboard
https://vercel.com/new

### 2. Import Git Repository
- Click "Import Git Repository"
- Select: `iamheisenburger/X-Dm-Tool`
- Branch: `main`

### 3. Configure Project Settings

**Build & Development Settings:**
- Framework Preset: `Next.js` ✓
- Root Directory: `./` ✓
- Build Command: `next build` (default) ✓
- Output Directory: `Next.js default` ✓
- Install Command: `npm install` (default) ✓

### 4. Add Environment Variables

Click "Environment Variables" and add each one:

| Key | Value | Environment |
|-----|-------|-------------|
| `TWITTER_API_KEY` | `your_key` | Production, Preview, Development |
| `TWITTER_API_BASE_URL` | `https://api.twitterapi.io` | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | `your_key` | Production, Preview, Development |
| `CONVEX_DEPLOYMENT` | `prod:resolute-mosquito-674` | Production, Preview, Development |
| `NEXT_PUBLIC_CONVEX_URL` | `https://resolute-mosquito-674.convex.cloud` | Production, Preview, Development |

**Note:** Select all three environments (Production, Preview, Development) for each variable.

### 5. Deploy
Click **"Deploy"** button.

## Getting API Keys

### Twitter API Key
1. Go to https://twitterapi.io
2. Sign up / Log in
3. Go to Dashboard
4. Copy your API key
5. Add payment method (pay-as-you-go)

**Estimated cost:** ~$14/month for STANDARD mode

### Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Go to Settings → API Keys
4. Click "Create Key"
5. Copy the key
6. Add payment method

**Estimated cost:** ~$4/month for STANDARD mode

### Convex URLs
Already set! These are from your Convex dashboard:
- **Dev:** `https://notable-ram-567.convex.cloud` (for local testing)
- **Prod:** `https://resolute-mosquito-674.convex.cloud` (for Vercel)

## After Deployment

### 1. Verify Deployment
- Visit your Vercel URL: `https://your-app.vercel.app`
- Should see the dashboard

### 2. Initialize Config
- Go to `/settings` page
- Verify config loaded from `public/config.json`
- Adjust settings if needed
- Click "Save Configuration"

### 3. Test Pipeline
- Go to Convex dashboard: https://dashboard.convex.dev/d/resolute-mosquito-674
- Functions → Actions → `pipeline:runManual` → Run
- Check logs for success

### 4. Verify Data
- Go to Convex dashboard → Tables
- Should see data in: `profiles`, `signals`, `candidates`

### 5. Check Dashboard
- Go back to your Vercel site
- Refresh homepage
- Should see candidates in both columns

## Troubleshooting

### Build fails with "Module not found"
- Make sure all dependencies are in `package.json`
- Try redeploying

### "No candidates" on dashboard
- Check Convex dashboard → Tables → `candidates`
- If empty, run pipeline manually
- Check API keys are correct

### API errors in logs
- Verify `TWITTER_API_KEY` is correct
- Verify `ANTHROPIC_API_KEY` is correct
- Check billing is set up for both services

### Convex connection issues
- Verify `NEXT_PUBLIC_CONVEX_URL` matches your production deployment
- Should be: `https://resolute-mosquito-674.convex.cloud`

## Cost Monitoring

### Twitter API
- Dashboard: https://twitterapi.io/dashboard
- Check usage daily
- Estimated: $0.46/day for STANDARD mode

### Anthropic API
- Dashboard: https://console.anthropic.com/settings/billing
- Check usage weekly
- Estimated: $0.14/day for STANDARD mode

### Vercel
- Free tier should be sufficient
- No additional cost unless high traffic

## Production Checklist

- [ ] Environment variables added in Vercel
- [ ] Deployment successful (green checkmark)
- [ ] Dashboard loads without errors
- [ ] Settings page loads config
- [ ] Convex tables visible in dashboard
- [ ] Pipeline runs successfully
- [ ] Candidates appear on dashboard
- [ ] CSV export works
- [ ] All API keys have billing set up
- [ ] Monitoring set up for costs

## Support

- **Vercel Issues:** https://vercel.com/docs
- **Convex Issues:** https://docs.convex.dev
- **Twitter API Issues:** https://twitterapi.io/support
- **Anthropic Issues:** https://docs.anthropic.com

## Repository
https://github.com/iamheisenburger/X-Dm-Tool
