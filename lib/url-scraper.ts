/**
 * URL Scraper for bio links (linktr.ee, beacons, carrd)
 * Extract tool/subscription mentions from landing pages
 */

export interface ScrapedTools {
  tools: string[];
  subscriptions: string[];
  source: string;
}

/**
 * Check if URL is a profile aggregator
 */
export function isProfileAggregator(url: string): boolean {
  const aggregators = ["linktr.ee", "beacons.ai", "carrd.co", "bio.link", "hoo.be", "taplink.at"];
  return aggregators.some((domain) => url.includes(domain));
}

/**
 * Extract tool mentions from HTML content
 */
function extractToolsFromHtml(html: string): string[] {
  const htmlLower = html.toLowerCase();
  const tools: string[] = [];

  // Common subscription services
  const subscriptionServices = [
    "netflix", "spotify", "hulu", "disney+", "youtube premium",
    "amazon prime", "apple tv", "hbo max", "paramount+", "peacock",
    "notion", "figma", "canva", "adobe", "photoshop", "illustrator",
    "chatgpt", "claude", "midjourney", "dall-e", "github copilot",
    "dropbox", "icloud", "google drive", "onedrive", "office 365",
    "slack", "discord", "zoom", "calendly", "loom",
    "xbox game pass", "playstation plus", "nintendo switch online",
    "crunchyroll", "funimation", "audible", "kindle unlimited",
    "grammarly", "duolingo", "headspace", "calm", "peloton"
  ];

  // Productivity tools often listed
  const productivityTools = [
    "notion", "obsidian", "roam", "evernote", "onenote",
    "todoist", "things", "omnifocus", "ticktick",
    "linear", "asana", "trello", "monday", "clickup",
    "superhuman", "spark", "hey", "gmail",
    "raycast", "alfred", "rectangle", "magnet"
  ];

  const allTools = [...new Set([...subscriptionServices, ...productivityTools])];

  for (const tool of allTools) {
    // Look for tool name in various contexts
    const patterns = [
      new RegExp(`\\b${tool}\\b`, "i"),
      new RegExp(`/${tool}`, "i"), // URL path
      new RegExp(`${tool}\\.com`, "i"), // Domain
      new RegExp(`using ${tool}`, "i"), // "using X"
      new RegExp(`built with ${tool}`, "i"), // "built with X"
    ];

    if (patterns.some((p) => p.test(html))) {
      tools.push(tool);
    }
  }

  return [...new Set(tools)]; // Dedupe
}

/**
 * Scrape a profile aggregator URL for tools
 */
export async function scrapeProfileUrl(url: string): Promise<ScrapedTools | null> {
  try {
    if (!isProfileAggregator(url)) {
      return null;
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract tools
    const tools = extractToolsFromHtml(html);

    // Separate into subscriptions vs tools
    const subscriptions = tools.filter((t) =>
      ["netflix", "spotify", "hulu", "disney", "youtube", "amazon", "apple", "hbo", "paramount", "crunchyroll"].some((sub) => t.includes(sub))
    );

    const otherTools = tools.filter((t) => !subscriptions.includes(t));

    return {
      tools: otherTools,
      subscriptions,
      source: url,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

/**
 * Extract tools from multiple URLs (if profile has several)
 */
export async function scrapeMultipleUrls(urls: string[]): Promise<string[]> {
  const allTools: string[] = [];

  for (const url of urls) {
    if (!isProfileAggregator(url)) continue;

    const result = await scrapeProfileUrl(url);
    if (result) {
      allTools.push(...result.tools);
      allTools.push(...result.subscriptions);
    }

    // Small delay to be respectful
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return [...new Set(allTools)]; // Dedupe
}

/**
 * Quick check: does bio URL contain tool indicators?
 * (Without fetching - just URL analysis)
 */
export function quickCheckBioUrl(url: string): string[] {
  const urlLower = url.toLowerCase();
  const tools: string[] = [];

  // Some people put tools directly in their URL/subdomain
  const commonTools = [
    "notion", "figma", "github", "linkedin", "twitter", "youtube",
    "spotify", "instagram", "tiktok", "twitch"
  ];

  for (const tool of commonTools) {
    if (urlLower.includes(tool)) {
      tools.push(tool);
    }
  }

  return tools;
}
