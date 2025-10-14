/**
 * Tweet Analysis Utilities
 * Extract deeper insights from tweets for better classification and DM generation
 */

export interface TweetContext {
  text: string;
  createdAt: string;
  type: "original" | "reply" | "retweet";
  engagement: number;
  sentiment: "positive" | "negative" | "neutral";
  isComplaint: boolean;
  isPainPoint: boolean;
  mentions: string[];
  hashtags: string[];
}

export interface TimelineInsights {
  painPoints: string[];
  interests: string[];
  tools: string[];
  recentActivity: TweetContext[];
  engagementPattern: {
    avgEngagement: number;
    repliesRatio: number;
    retweetsRatio: number;
    isActive: boolean;
  };
  topicClusters: string[];
}

/**
 * Analyze sentiment of a tweet
 */
export function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const textLower = text.toLowerCase();

  // Negative indicators
  const negativeWords = [
    "hate", "awful", "terrible", "worst", "frustrated", "annoying", "annoyed",
    "disappointed", "sucks", "bad", "horrible", "useless", "waste", "expensive",
    "overpriced", "scam", "never", "can't", "won't", "failed", "broken", "bug",
    "problem", "issue", "error", "forgot", "missed", "late", "charged"
  ];

  // Positive indicators
  const positiveWords = [
    "love", "great", "awesome", "amazing", "excellent", "fantastic", "perfect",
    "helpful", "useful", "easy", "simple", "best", "good", "nice", "happy",
    "glad", "excited", "works", "solved", "fixed", "recommend", "worth"
  ];

  const negativeCount = negativeWords.filter(w => textLower.includes(w)).length;
  const positiveCount = positiveWords.filter(w => textLower.includes(w)).length;

  if (negativeCount > positiveCount) return "negative";
  if (positiveCount > negativeCount) return "positive";
  return "neutral";
}

/**
 * Detect if tweet is a complaint
 */
export function detectComplaint(text: string): boolean {
  const textLower = text.toLowerCase();

  const complaintPatterns = [
    // Subscription pain
    /forgot to cancel/i,
    /auto.?renew/i,
    /charged (me|again)/i,
    /price increase/i,
    /too (many|expensive)/i,
    /waste of money/i,
    /barely use/i,
    /(didn't|didnt) (use|need)/i,

    // Frustration
    /why (am i|do i)/i,
    /still paying/i,
    /can't believe/i,
    /seriously\?/i,

    // Questions showing pain
    /how do i cancel/i,
    /anyone know how/i,
    /need (to|a) (cancel|unsubscribe)/i
  ];

  return complaintPatterns.some(pattern => pattern.test(text));
}

/**
 * Detect if tweet is a pain point
 */
export function detectPainPoint(text: string): boolean {
  const textLower = text.toLowerCase();

  const painPatterns = [
    // Subscription issues
    "subscription", "subscriptions", "cancel", "trial", "renew", "charge",
    "auto-renew", "forgot", "expensive", "price increase", "too much",

    // Budget issues
    "budget", "broke", "can't afford", "waste", "spending too much",
    "save money", "cut costs",

    // Overwhelm
    "too many", "overwhelmed", "lost track", "forgot about"
  ];

  return painPatterns.some(pattern => textLower.includes(pattern));
}

/**
 * Extract tool/service mentions from tweet
 */
export function extractToolMentions(text: string): string[] {
  const textLower = text.toLowerCase();
  const tools: string[] = [];

  const commonTools = [
    "netflix", "spotify", "hulu", "disney+", "disney plus", "youtube premium",
    "amazon prime", "apple tv", "hbo max", "paramount+", "peacock",
    "notion", "figma", "canva", "adobe", "photoshop", "chatgpt", "claude",
    "github copilot", "midjourney", "dall-e", "grammarly",
    "dropbox", "icloud", "google drive", "onedrive", "office 365",
    "slack", "discord", "zoom", "calendly",
    "xbox game pass", "playstation plus", "nintendo switch online",
    "crunchyroll", "funimation", "audible", "kindle unlimited"
  ];

  for (const tool of commonTools) {
    if (textLower.includes(tool)) {
      tools.push(tool);
    }
  }

  return [...new Set(tools)]; // Dedupe
}

/**
 * Extract hashtags from tweet
 */
export function extractHashtags(text: string): string[] {
  const hashtagPattern = /#(\w+)/g;
  const matches = text.match(hashtagPattern);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

/**
 * Extract @mentions from tweet
 */
export function extractMentions(text: string): string[] {
  const mentionPattern = /@(\w+)/g;
  const matches = text.match(mentionPattern);
  return matches ? matches.map(m => m.slice(1).toLowerCase()) : [];
}

/**
 * Analyze full timeline to extract insights
 */
export function analyzeTimeline(tweets: Array<{
  text: string;
  createdAt: string;
  isReply?: boolean;
  isRetweet?: boolean;
  retweetCount?: number;
  likeCount?: number;
  replyCount?: number;
}>): TimelineInsights {
  const contexts: TweetContext[] = tweets.map(t => ({
    text: t.text,
    createdAt: t.createdAt,
    type: t.isRetweet ? "retweet" : t.isReply ? "reply" : "original",
    engagement: (t.retweetCount || 0) + (t.likeCount || 0) + (t.replyCount || 0),
    sentiment: analyzeSentiment(t.text),
    isComplaint: detectComplaint(t.text),
    isPainPoint: detectPainPoint(t.text),
    mentions: extractMentions(t.text),
    hashtags: extractHashtags(t.text)
  }));

  // Extract pain points (from complaint tweets)
  const painPoints: string[] = [];
  contexts.filter(c => c.isComplaint).forEach(c => {
    if (c.text.toLowerCase().includes("forgot to cancel")) {
      painPoints.push("Forgets to cancel subscriptions");
    }
    if (c.text.toLowerCase().includes("price increase") || c.text.toLowerCase().includes("too expensive")) {
      painPoints.push("Frustrated by price increases");
    }
    if (c.text.toLowerCase().includes("too many")) {
      painPoints.push("Overwhelmed by number of subscriptions");
    }
    if (c.text.toLowerCase().includes("auto-renew") || c.text.toLowerCase().includes("charged")) {
      painPoints.push("Surprised by auto-renewal charges");
    }
  });

  // Extract tools mentioned
  const allTools: string[] = [];
  contexts.forEach(c => {
    allTools.push(...extractToolMentions(c.text));
  });
  const tools = [...new Set(allTools)];

  // Extract interests from hashtags and topics
  const allHashtags = contexts.flatMap(c => c.hashtags);
  const topicClusters = [...new Set(allHashtags)].slice(0, 10);

  // Identify interests (topics they tweet about frequently)
  const interests: string[] = [];
  if (topicClusters.some(tag => ["productivity", "notion", "tools", "workflow"].includes(tag))) {
    interests.push("productivity");
  }
  if (topicClusters.some(tag => ["gaming", "gamer", "games", "xbox", "playstation"].includes(tag))) {
    interests.push("gaming");
  }
  if (topicClusters.some(tag => ["design", "ui", "ux", "figma", "designer"].includes(tag))) {
    interests.push("design");
  }
  if (topicClusters.some(tag => ["coding", "developer", "programming", "javascript", "python"].includes(tag))) {
    interests.push("programming");
  }
  if (topicClusters.some(tag => ["budget", "finance", "money", "saving", "frugal"].includes(tag))) {
    interests.push("personal finance");
  }

  // Recent activity (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentActivity = contexts.filter(c => {
    const tweetDate = new Date(c.createdAt).getTime();
    return tweetDate > sevenDaysAgo;
  });

  // Engagement pattern
  const originalTweets = contexts.filter(c => c.type === "original");
  const avgEngagement = originalTweets.length > 0
    ? originalTweets.reduce((sum, t) => sum + t.engagement, 0) / originalTweets.length
    : 0;

  const repliesRatio = contexts.filter(c => c.type === "reply").length / contexts.length;
  const retweetsRatio = contexts.filter(c => c.type === "retweet").length / contexts.length;
  const isActive = recentActivity.length >= 3; // 3+ tweets in last 7 days

  return {
    painPoints: [...new Set(painPoints)],
    interests,
    tools,
    recentActivity,
    engagementPattern: {
      avgEngagement,
      repliesRatio,
      retweetsRatio,
      isActive
    },
    topicClusters
  };
}

/**
 * Extract pain points from a single tweet (for quick analysis)
 */
export function extractPainFromTweet(text: string): string[] {
  const pain: string[] = [];
  const textLower = text.toLowerCase();

  if (textLower.includes("forgot to cancel") || textLower.includes("forgot about")) {
    pain.push("forgets to cancel");
  }
  if (textLower.includes("too many") || textLower.includes("overwhelmed")) {
    pain.push("too many subscriptions");
  }
  if (textLower.includes("expensive") || textLower.includes("price") || textLower.includes("costly")) {
    pain.push("cost concerns");
  }
  if (textLower.includes("charged") || textLower.includes("auto-renew") || textLower.includes("renewal")) {
    pain.push("unexpected charges");
  }
  if (textLower.includes("barely use") || textLower.includes("don't use") || textLower.includes("didn't use")) {
    pain.push("paying for unused services");
  }
  if (textLower.includes("track") || textLower.includes("lost track") || textLower.includes("organize")) {
    pain.push("needs better tracking");
  }

  return pain;
}

/**
 * Generate a summary of timeline insights for DM personalization
 */
export function generateTimelineSummary(insights: TimelineInsights): string {
  const parts: string[] = [];

  if (insights.painPoints.length > 0) {
    parts.push(`Pain points: ${insights.painPoints.join(", ")}`);
  }

  if (insights.tools.length > 0) {
    parts.push(`Uses: ${insights.tools.slice(0, 5).join(", ")}`);
  }

  if (insights.interests.length > 0) {
    parts.push(`Interests: ${insights.interests.join(", ")}`);
  }

  if (insights.engagementPattern.isActive) {
    parts.push("Active user (tweets regularly)");
  }

  if (insights.recentActivity.filter(t => t.isComplaint).length > 0) {
    parts.push(`Recent complaints: ${insights.recentActivity.filter(t => t.isComplaint).length}`);
  }

  return parts.join(" | ");
}
