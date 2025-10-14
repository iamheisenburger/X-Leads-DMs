/**
 * Twitter API Client for twitterapi.io
 * Documentation: https://docs.twitterapi.io
 */

// Prefer env override, fallback to base without version suffix (matches prior working path)
const TWITTER_API_BASE = process.env.TWITTER_API_BASE_URL || "https://api.twitterapi.io";
const TWITTER_API_KEY_FALLBACK = process.env.TWITTER_API_KEY || "";

function resolveApiKey(provided?: string): string {
  return provided || TWITTER_API_KEY_FALLBACK || "";
}

if (!TWITTER_API_KEY_FALLBACK) {
  console.warn("WARNING: TWITTER_API_KEY not set!");
}

export interface TwitterUser {
  id: string;
  userName: string;
  name: string;
  description?: string;
  profilePicture?: string;
  url?: string;
  location?: string;
  followers?: number;
  following?: number;
  statusesCount?: number;
  isBlueVerified?: boolean;
  canDm?: boolean;
  createdAt?: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  createdAt: string;
  author?: TwitterUser;
  retweetCount?: number;
  replyCount?: number;
  likeCount?: number;
  quoteCount?: number;
  viewCount?: number;
  isReply?: boolean;
  isRetweet?: boolean;
  lang?: string;
}

/**
 * Advanced Search - Search tweets with full user data
 * Supports pagination to fetch more than 20 results (API limit per call)
 */
export async function searchTweets(
  query: string,
  maxResults: number = 100,
  apiKey?: string
): Promise<TwitterTweet[]> {
  const allTweets: TwitterTweet[] = [];
  let cursor: string | null = null;
  const maxPages = Math.ceil(maxResults / 20); // 20 results per page

  try {
    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams({
        query,
        queryType: "Latest", // or "Top"
      });

      // Add cursor for pagination (if available from previous response)
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await fetch(
        `${TWITTER_API_BASE}/twitter/tweet/advanced_search?${params}`,
        {
          method: "GET",
          headers: {
            "X-API-Key": resolveApiKey(apiKey),
          },
        }
      );

      if (!response.ok) {
        console.error(`Twitter API error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error("Response:", text);
        // Return what we have so far instead of empty array
        break;
      }

      const result = await response.json();

      if (result.tweets && Array.isArray(result.tweets)) {
        const tweets = result.tweets.map((tweet: any) => ({
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.createdAt,
          author: tweet.author
            ? {
                id: tweet.author.id,
                userName: tweet.author.userName || tweet.author.screen_name,
                name: tweet.author.name,
                description: tweet.author.profile_bio?.description || tweet.author.description || "",
                profilePicture: tweet.author.profilePicture || tweet.author.profile_image_url_https,
                followers: tweet.author.followers_count || tweet.author.followers || 0,
                following: tweet.author.friends_count || tweet.author.following || 0,
                statusesCount: tweet.author.statuses_count || tweet.author.statusesCount || 0,
                isBlueVerified: tweet.author.isBlueVerified || tweet.author.verified || false,
                canDm: tweet.author.canDm || tweet.author.can_dm,
              }
            : undefined,
          retweetCount: tweet.retweetCount,
          replyCount: tweet.replyCount,
          likeCount: tweet.likeCount,
          quoteCount: tweet.quoteCount,
          viewCount: tweet.viewCount,
          isReply: tweet.isReply,
          lang: tweet.lang,
        }));

        allTweets.push(...tweets);

        // Check if we have enough results or if there's no next page
        if (allTweets.length >= maxResults || !result.next_cursor) {
          break;
        }

        cursor = result.next_cursor;

        // Small delay between pagination requests
        if (page < maxPages - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        // No more results
        break;
      }
    }

    return allTweets.slice(0, maxResults); // Trim to exact count
  } catch (error) {
    console.error("Error searching tweets:", error);
    // Return partial results if we got any
    return allTweets;
  }
}

/**
 * Search users by keyword - Returns users with keyword in name/bio
 * Perfect for finding "indie hacker", "founder", "building in public" etc.
 */
export async function searchUserByKeyword(
  keyword: string,
  maxResults: number = 100,
  apiKey?: string
): Promise<TwitterUser[]> {
  const allUsers: TwitterUser[] = [];
  let cursor = "";
  const maxPages = Math.ceil(maxResults / 20); // 20 results per page

  try {
    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams({
        query: keyword,
      });

      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await fetch(
        `${TWITTER_API_BASE}/twitter/user/search?${params}`,
        {
          method: "GET",
          headers: {
            "X-API-Key": resolveApiKey(apiKey),
          },
        }
      );

      if (!response.ok) {
        console.error(`Twitter API error: ${response.status} ${response.statusText}`);
        break;
      }

      const result = await response.json();

      if (result.users && Array.isArray(result.users)) {
        const users = result.users.map((user: any) => ({
          id: user.id,
          userName: user.userName || user.screen_name,
          name: user.name,
          description: user.profile_bio?.description || user.description || "",
          profilePicture: user.profilePicture || user.profile_image_url_https,
          url: user.url,
          location: user.location,
          followers: user.followers_count || user.followers || 0,
          following: user.friends_count || user.following || 0,
          statusesCount: user.statuses_count || user.statusesCount || 0,
          isBlueVerified: user.isBlueVerified || user.verified || false,
          canDm: user.canDm || user.can_dm,
          createdAt: user.createdAt || user.created_at,
        }));

        allUsers.push(...users);

        if (allUsers.length >= maxResults || !result.next_cursor) {
          break;
        }

        cursor = result.next_cursor;
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        break;
      }
    }

    return allUsers.slice(0, maxResults);
  } catch (error) {
    console.error("Error searching users:", error);
    return allUsers;
  }
}

/**
 * Get user's last tweets
 * Takes userId OR userName (userName is preferred)
 */
export async function getUserLastTweets(
  userName: string,
  count: number = 5,
  apiKey?: string
): Promise<TwitterTweet[]> {
  try {
    const params = new URLSearchParams({
      userName,
    });

    const response = await fetch(
      `${TWITTER_API_BASE}/twitter/user/last_tweets?${params}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": resolveApiKey(apiKey),
        },
      }
    );

    if (!response.ok) {
      console.error(`Twitter API error: ${response.status}`);
      return [];
    }

    const result = await response.json();

    if (result.status === "success" && result.tweets && Array.isArray(result.tweets)) {
      return result.tweets.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.createdAt,
        author: tweet.author
          ? {
              id: tweet.author.id,
              userName: tweet.author.userName,
              name: tweet.author.name,
              description: tweet.author.description,
              profilePicture: tweet.author.profilePicture,
              followers: tweet.author.followers,
              following: tweet.author.following,
              isBlueVerified: tweet.author.isBlueVerified,
              canDm: tweet.author.canDm,
            }
          : undefined,
        retweetCount: tweet.retweetCount,
        replyCount: tweet.replyCount,
        likeCount: tweet.likeCount,
        quoteCount: tweet.quoteCount,
        viewCount: tweet.viewCount,
        isReply: tweet.isReply,
        lang: tweet.lang,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return [];
  }
}

/**
 * Get user info by username
 */
export async function getUser(username: string, apiKey?: string): Promise<TwitterUser | null> {
  try {
    const params = new URLSearchParams({
      userName: username,
    });

    const response = await fetch(`${TWITTER_API_BASE}/twitter/user/info?${params}`, {
      method: "GET",
      headers: {
        "X-API-Key": resolveApiKey(apiKey),
      },
    });

    if (!response.ok) {
      console.error(`Twitter API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();

    if (result.status === "success" && result.data) {
      return {
        id: result.data.id,
        userName: result.data.userName,
        name: result.data.name,
        description: result.data.description,
        profilePicture: result.data.profilePicture,
        url: result.data.url,
        location: result.data.location,
        followers: result.data.followers,
        following: result.data.following,
        statusesCount: result.data.statusesCount,
        isBlueVerified: result.data.isBlueVerified,
        canDm: result.data.canDm,
        createdAt: result.data.createdAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Extract unique users from search results
 */
export function extractUniqueUsers(tweets: TwitterTweet[]): TwitterUser[] {
  const userMap = new Map<string, TwitterUser>();

  tweets.forEach((tweet) => {
    if (tweet.author && !userMap.has(tweet.author.id)) {
      userMap.set(tweet.author.id, tweet.author);
    }
  });

  return Array.from(userMap.values());
}
