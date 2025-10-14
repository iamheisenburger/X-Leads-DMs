export interface AppConfig {
  dailyTargets: {
    collab: number;
    users: number;
  };
  costMode: "LEAN" | "STANDARD" | "AGGRESSIVE";
  brandTerms: string[];
  collabQueries: string[];
  userQueries: string[];
  collabWeights: {
    rtSmall: number;
    qtSmall: number;
    bioTerms: number;
    replyRateSmall: number;
    dmOpen: number;
  };
  userWeights: {
    brand: number;
    pain: number;
    activity: number;
    fit: number;
  };
  followerBand: {
    min: number;
    max: number;
  };
}

export const DEFAULT_CONFIG: AppConfig = {
  dailyTargets: {
    collab: 10,
    users: 20,
  },
  costMode: "STANDARD",
  brandTerms: [
    "netflix",
    "spotify",
    "youtube premium",
    "amazon prime",
    "chatgpt",
    "claude",
    "notion",
    "figma",
    "canva",
    "midjourney",
    "adobe",
    "office 365",
    "icloud",
    "dropbox",
    "xbox game pass",
    "playstation plus",
    "nintendo switch online",
    "disney+",
    "hulu",
    "paramount+",
    "apple tv",
    "max",
    "crunchyroll",
  ],
  collabQueries: [
    // SPECIFIC INDIE MAKER QUERIES - Target actual builders
    '#buildinpublic -is:retweet lang:en',
    '#indiehacker -is:retweet lang:en',
    '"indie maker" -is:retweet lang:en',
    '"solo founder" -is:retweet lang:en',
    '"bootstrapped" (saas OR startup) -is:retweet lang:en',
    '"just launched" (app OR tool OR product) -is:retweet lang:en',
    '"shipping" (feature OR update) indie -is:retweet lang:en',
    'from:levelsio OR from:marc_louvion OR from:tdinh_me -is:retweet', // Follow indie maker community
  ],
  userQueries: [
    // BROAD: Everyone has subscriptions - just find active people
    '(subscriptions OR monthly OR paying OR Netflix OR Spotify) -is:retweet lang:en',
    '(productivity OR tools OR apps OR software) -is:retweet lang:en',
  ],
  collabWeights: {
    rtSmall: 0.5, // Reduced - Claude can't reliably detect this
    qtSmall: 0.5,
    bioTerms: 2, // Increased - more reliable signal
    replyRateSmall: 2, // Increased - engagement matters
    dmOpen: 1, // Increased - accessibility is key
  },
  userWeights: {
    brand: 1, // Reduced - weak signal (casual mentions)
    pain: 5, // Increased - strongest signal (complaints)
    activity: 2, // Keep - recency matters
    fit: 3, // Increased - niche match is important
  },
  followerBand: {
    min: 500, // Lowered to 500 - many #buildinpublic users have <1K
    max: 250000,
  },
};

// Cost mode configurations
export const COST_MODES = {
  LEAN: {
    searchHits: 300,
    profiles: 200,
    timelineTweets: 1000,
    estimatedCost: 0.231, // per day
  },
  STANDARD: {
    searchHits: 600,
    profiles: 400,
    timelineTweets: 2000,
    estimatedCost: 0.462,
  },
  AGGRESSIVE: {
    searchHits: 1500,
    profiles: 1000,
    timelineTweets: 5000,
    estimatedCost: 1.155,
  },
} as const;
