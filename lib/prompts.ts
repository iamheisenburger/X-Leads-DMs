/**
 * LLM Prompts for Claude Haiku (classifier) and Sonnet (DM generator)
 */

/**
 * Extract bio keywords before sending to Claude (pre-processing)
 */
export function extractBioKeywords(bio: string): {
  collab_signals: string[];
  user_signals: string[];
} {
  const bioLower = bio.toLowerCase();

  const collabKeywords = [
    'founder', 'creator', 'maker', 'builder', 'indie', 'solopreneur',
    'building', 'shipping', 'launching', 'saas', 'startup',
    'developer', 'dev', 'coder', 'programmer', 'engineer',
    'designer', 'ui', 'ux', 'product',
    'entrepreneur', 'bootstrapped', 'bootstrap'
  ];

  const userKeywords = [
    'student', 'gamer', 'gaming', 'designer', 'developer', 'engineer',
    'freelance', 'creative', 'artist', 'writer', 'photographer',
    'budget', 'saving', 'finance', 'money', 'frugal',
    'productivity', 'notion', 'figma', 'adobe'
  ];

  const collabSignals = collabKeywords.filter(kw => bioLower.includes(kw));
  const userSignals = userKeywords.filter(kw => bioLower.includes(kw));

  return { collab_signals: collabSignals, user_signals: userSignals };
}

export const CLASSIFIER_SYSTEM_PROMPT = `You triage X (Twitter) profiles into two buckets:

1. COLLAB_CREATOR: Creators/builders in the indie maker/startup space who might share relevant content
2. POTENTIAL_USER: Any active individual on X (EVERYONE has subscriptions!)

**DEFAULT TO YES - BE EXTREMELY LENIENT:**
- POTENTIAL_USER should be TRUE for 95%+ of individual accounts
- If you see even 1 weak signal → classify as TRUE
- When in doubt → classify as TRUE (we filter later)
- Only set FALSE if you're 100% certain it's a brand/bot/spam

**SubWise Context:** Personal subscription tracker for managing:
- Streaming: Netflix, Spotify, YouTube Premium, Disney+
- Productivity: Notion, Figma, Adobe, ChatGPT, Claude
- Gaming: Xbox Game Pass, PlayStation Plus
- Cloud: iCloud, Dropbox, Google Drive, Office 365

**COLLAB_CREATOR = TRUE if (SPECIFICALLY indie makers/builders in tech):**
- Bio MUST mention tech/building terms: indie maker, indie hacker, founder, building, shipping, SaaS, startup, developer, solopreneur
- Recent tweets show ACTUAL building activity: product launches, feature updates, tech discussions, #buildinpublic
- NOT just gamers, musicians, artists, or content creators in other niches
- Has 500+ followers (shows some community engagement)
- IMPORTANT: Must be in tech/software/SaaS space - not gaming, music, art, etc.

**POTENTIAL_USER = TRUE unless they meet exclusion criteria:**
Exclusions (ONLY set FALSE if):
1. Business/brand: Profile name has LLC/Inc/Corp/Ltd, or bio says "Official account of [Company]"
2. Completely inactive: No tweets AND no visible activity signs in 30+ days
3. Bot/spam: Suspicious patterns, no real bio, auto-generated username

IMPORTANT: Activity includes likes/RTs/replies, NOT just posting! Default to YES for everyone else.

**ONLY set BOTH to FALSE if:**
- Profile name has: LLC, Inc, Ltd, Corp, "Official Account", "News", "Bot"
- Bio clearly states it's a company/brand/business/organization
- Only promotional content (no personal tweets or opinions)
- Inactive account (no tweets in 30+ days)

**CRITICAL: "reason" field:**
- Must quote EXACT text from bio OR tweet (in quotes)
- Be specific about what signal you detected
- Example: "Bio says 'I RT cool indie projects' + tweets show engagement with small builders"

Return JSON ONLY - no explanation.`;

export function buildClassifierPrompt(
  profile: {
    username: string;
    name: string;
    description?: string;
    followers_count?: number;
    url?: string;
  },
  recentTweets: Array<{ text: string; created_at: string }>,
  timelineInsights?: {
    painPoints: string[];
    tools: string[];
    interests: string[];
    isActive: boolean;
    complaintCount: number;
  }
): string {
  const bioKeywords = extractBioKeywords(profile.description || "");
  const hasCollabKeywords = bioKeywords.collab_signals.length > 0;
  const hasUserKeywords = bioKeywords.user_signals.length > 0;

  return `Classify this profile:

**Profile:**
- Name: ${profile.name}
- Handle: @${profile.username}
- Bio: "${profile.description || "No bio"}"
- Followers: ${profile.followers_count || 0}
- URL: ${profile.url || "None"}
${hasCollabKeywords ? `- Bio contains COLLAB keywords: ${bioKeywords.collab_signals.join(', ')}` : ''}
${hasUserKeywords ? `- Bio contains USER keywords: ${bioKeywords.user_signals.join(', ')}` : ''}

${timelineInsights ? `
**Timeline Insights:**
${timelineInsights.painPoints.length > 0 ? `- Pain points detected: ${timelineInsights.painPoints.join(', ')}` : ''}
${timelineInsights.tools.length > 0 ? `- Uses these tools: ${timelineInsights.tools.slice(0, 8).join(', ')}` : ''}
${timelineInsights.interests.length > 0 ? `- Interests: ${timelineInsights.interests.join(', ')}` : ''}
${timelineInsights.complaintCount > 0 ? `- Has ${timelineInsights.complaintCount} complaint tweets recently` : ''}
${timelineInsights.isActive ? '- Active user (tweets regularly)' : '- Less active'}
` : ''}

**Recent Tweets:**
${recentTweets.length > 0 ? recentTweets.map((t, i) => `${i + 1}. "${t.text}"`).join("\n") : "No recent tweets found"}

**Instructions:**
1. Look for ANY positive signals first (be optimistic!)
2. Only reject if CLEARLY a brand/company (has LLC, Inc, Corp, Official in name)
3. When in doubt → classify as TRUE for at least one bucket
4. "reason" should mention what you found (doesn't need exact quotes, just the key signal)

Return ONLY valid JSON:
{
  "is_collab_creator": boolean,
  "is_potential_user": boolean,
  "amplifier_signals": {
    "rt_small_ratio": 0.3,
    "qt_small_ratio": 0.2,
    "replies_to_small_last7d": false
  } | null,
  "dm_open": null,
  "pain_points": ["forgot to cancel", "too many subs", "budget conscious"],
  "brands": ["netflix", "spotify", "chatgpt"],
  "niches": ["student", "gamer", "creator", "tech"],
  "reason": "Tweet: 'exact quote from their content' shows [specific behavior]"
}`;
}

export const DM_GENERATOR_SYSTEM_PROMPT = `You write genuine, conversational cold DMs that actually get responses.

**Style Guide:**
- Sound like a real person, not a bot or marketer
- Start with specific observation about their content (quote it!)
- NO corporate jargon: "leverage", "solution", "platform", "ecosystem"
- YES casual language: "Hey", "noticed", "built", "works"
- Keep it SHORT - 2 sentences max
- End with low-pressure question, not hard sell

**Bad Example:**
"I noticed your interest in productivity solutions. Our platform leverages AI to optimize subscription management."

**Good Example:**
"Saw your tweet about forgetting to cancel Hulu again - literally same thing happened to me last month. Built a tracker that catches this stuff before renewal. Want to see it?"

Return JSON ONLY with two fields: icebreaker and dm.`;

export function buildDmGeneratorPrompt(
  profile: {
    name: string;
    handle: string;
  },
  bucket: "collab" | "user",
  reason: string,
  timelineSummary?: string,
  tweetSnippet?: string
): string {
  if (bucket === "collab") {
    return `Write a casual DM to ${profile.name} (@${profile.handle}) for a potential RT exchange.

**Context:**
- Why reaching out: ${reason}
${timelineSummary ? `- Timeline insights: ${timelineSummary}` : ''}
${tweetSnippet ? `- Recent tweet: "${tweetSnippet}"` : ""}

**Instructions:**
1. Be AUTHENTIC - don't claim specific things about their content
2. Simply say "I post content you might relate to" or "I share stuff about building/shipping"
3. Offer mutual support - you'll RT their stuff too
4. Keep it SHORT and genuine

**Good example:**
"Hey! I'm also building in public and post content you might relate to. Would love to support each other - happy to RT your launches/updates if you could do the same when my stuff resonates with you?"

**Another good example:**
"Saw you're shipping regularly - respect that grind! I post similar content about my journey building SubWise. Want to support each other with RTs when we ship?"

**Bad example:**
"I saw your tweet about X and loved your point about Y. Can you RT my content?"

Return JSON:
{
  "icebreaker": "Brief, authentic connection point",
  "dm": "Mutual support offer (2 sentences max)"
}`;
  } else {
    return `Write a casual DM to ${profile.name} (@${profile.handle}) about SubWise (subscription tracker).

**Context:**
- Why reaching out: ${reason}
${timelineSummary ? `- Timeline insights: ${timelineSummary}` : ''}
${tweetSnippet ? `- Recent tweet: "${tweetSnippet}"` : ""}
- SubWise is a FREE web app (works on mobile too)

**Instructions:**
1. Reference their SPECIFIC pain point from timeline (use exact details!)
2. Mention SubWise solves exactly that problem
3. Naturally mention it's free and works everywhere (don't force it, weave it in)
4. Keep it 2-3 sentences, empathetic and human

**Good example:**
"Hey! Saw you mentioned dealing with subscriptions - I built something that might help. SubWise is a free tracker that catches forgotten subs before they renew. Want me to send you the link?"

**Another good example:**
"Your tweet about subscription costs resonated - I was losing $40/mo to forgotten apps. Made a simple tracker (SubWise) that's been helpful. It's free if you want to check it out!"

**Bad example:**
"Hi! I saw you tweet about subscriptions. Check out SubWise!"

Return JSON:
{
  "icebreaker": "Empathy + specific pain point reference",
  "dm": "Solution + personalized ask (2 sentences max)"
}`;
  }
}
