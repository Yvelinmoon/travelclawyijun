/**
 * Discord Profile Management
 *
 * Used to update the Bot's nickname and avatar after awakening
 *
 * Implementation approaches:
 * 1. Use OpenClaw's exec tool to call the Discord API
 * 2. Or use discord.js REST API
 * 3. Or directly HTTP-call the Discord API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────
// Try multiple environment variable names (compatibility with different setups)
let TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

// If not in environment, try loading from .env file
if (!TOKEN) {
  try {
    const envPath = path.join(__dirname, '.env');
    if (require('fs').existsSync(envPath)) {
      const envContent = require('fs').readFileSync(envPath, 'utf8');
      const match = envContent.match(/^DISCORD_(?:BOT_)?TOKEN=(.+)$/m);
      if (match) {
        TOKEN = match[1].trim();
        console.log('[Discord] Token loaded from .env file');
      }
    }
  } catch (err) {
    console.warn('[Discord] Failed to load token from .env:', err.message);
  }
}

const ASSETS_DIR = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// ─── Utility Functions ────────────────────────────────────────────────
/**
 * Validate whether an image URL is accessible
 * @param {string} url - Image URL
 * @returns {Promise<boolean>}
 */
async function isValidImageUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const req = https.get(url, { timeout: 5000 }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Redirect — follow it
        isValidImageUrl(res.headers.location).then(resolve);
        return;
      }
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ─── Discord API Helpers ──────────────────────────────────────────────
/**
 * Call the Discord API
 */
function callDiscordAPI(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      path: `/api/v10${endpoint}`,
      method,
      headers: {
        'Authorization': `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(json.message || `Discord API Error ${res.statusCode}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`Discord API Error ${res.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Download an image
 */
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(ASSETS_DIR, filename);

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenClaw Bot/1.0)',
      },
    };

    https.get(url, options, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Redirect
        downloadImage(res.headers.location, filename).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        fs.unlink(filepath, () => {});
        reject(new Error(`Image download failed: HTTP ${res.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      res.pipe(file);

      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        if (stats.size < 1000) {
          // File too small — probably not a valid image
          fs.unlink(filepath, () => {});
          reject(new Error('Downloaded file is too small; may not be a valid image'));
          return;
        }
        resolve(filepath);
      });
    }).on('error', err => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// ─── Profile Update Functions ─────────────────────────────────────────
/**
 * Update Bot nickname
 *
 * @param {string} guildId - Server ID
 * @param {string} newNickname - New nickname
 */
async function updateNickname(guildId, newNickname) {
  if (!TOKEN) {
    throw new Error('Missing DISCORD_BOT_TOKEN environment variable');
  }

  try {
    // Use @me endpoint to update the current Bot's nickname
    // Note: must use @me, not the Bot ID — this is a Discord API requirement
    await callDiscordAPI(
      `/guilds/${guildId}/members/@me`,
      'PATCH',
      { nick: newNickname }
    );

    console.log(`[Discord] Nickname updated to: ${newNickname}`);
    return true;
  } catch (err) {
    console.error('[Discord] Nickname update failed:', err.message);
    throw err;
  }
}

/**
 * Update Bot avatar
 *
 * @param {string} imageUrl - Image URL
 */
async function updateAvatar(imageUrl) {
  if (!TOKEN) {
    throw new Error('Missing DISCORD_BOT_TOKEN environment variable');
  }

  try {
    // Download image
    const filename = `avatar_${Date.now()}.jpg`;
    const filepath = await downloadImage(imageUrl, filename);

    // Read and convert to base64
    const imageBuffer = fs.readFileSync(filepath);
    const base64Data = imageBuffer.toString('base64');

    // Discord API requires the data:image/jpeg;base64, prefix
    const avatarData = `data:image/jpeg;base64,${base64Data}`;

    // Update avatar
    await callDiscordAPI('/users/@me', 'PATCH', {
      avatar: avatarData,
    });

    // Clean up temp file
    fs.unlinkSync(filepath);

    console.log(`[Discord] Avatar updated`);
    return true;
  } catch (err) {
    console.error('[Discord] Avatar update failed:', err.message);
    throw err;
  }
}

/**
 * Search for character image ⭐ Core function!
 *
 * ─────────────────────────────────────────────────────────────────────
 * ⭐ Search priority (important!)
 * ─────────────────────────────────────────────────────────────────────
 *
 * 【Priority 1】Neta API character query ← primary method!
 *   - Calls neta-skills' search_character_or_elementum command
 *   - Retrieves official character avatar from the Neta database
 *   - Suitable for: anime, game, novel, and other fictional characters
 *   - High success rate, good image quality
 *
 * 【Priority 2】Wikipedia / public image search
 *   - Suitable for: real people, well-known fictional characters
 *   - Uses Wikipedia, Fandom Wiki, and other public resources
 *
 * 【Priority 3】Predefined image library
 *   - Hardcoded reliable image URLs
 *   - Used as last resort
 *
 * 【Priority 4】Web search suggestion
 *   - When all automated searches fail, prompts user to do a web search
 *
 * ─────────────────────────────────────────────────────────────────────
 *
 * @param {string} characterName - Character name
 * @param {string} from - Work title
 * @returns {Promise<string|null>} Image URL
 */
async function searchCharacterImage(characterName, from) {
  console.log(`[Search] 🔍 Searching character image: ${characterName} (${from})`);
  console.log('[Search] ─────────────────────────────────────');
  console.log('[Search] ⭐ Primary method: Neta API character query');
  console.log('[Search] ─────────────────────────────────────');

  // ─── 【Priority 1】Neta API character query ← primary method! ─────────────────────
  console.log('[Search] [1/4] Trying Neta API search (flexible keyword strategy)...');
  const netaSearch = require('./neta-avatar-search.js');
  try {
    const netaResult = await netaSearch.searchCharacter(characterName, from);
    if (netaResult && netaResult.avatar) {
      console.log(`[Search] ✅ [Priority 1 - Neta] Found character: ${netaResult.name}`);
      console.log(`[Search] 🖼️ Avatar URL: ${netaResult.avatar}`);
      console.log(`[Search] 📝 Keywords used: ${netaResult.keywords || 'N/A'}`);
      return netaResult.avatar;
    }
  } catch (err) {
    console.warn('[Search] Neta search failed:', err.message);
  }

  // ─── 【Priority 2】Wikipedia / public image search ───────────────────────────────
  console.log('[Search] [2/4] Trying Wikipedia / public image search...');
  const wikiSearch = await searchWikiImage(characterName, from);
  if (wikiSearch) {
    console.log(`[Search] ✅ [Priority 2 - Wikipedia] Found image: ${wikiSearch}`);
    return wikiSearch;
  }

  // ─── 【Priority 3】Predefined image library ────────────────────────────────────────
  console.log('[Search] [3/4] Trying predefined image library...');
  const predefinedPeople = {
    // Real people - official Wikipedia portraits
    'Donald Trump': 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    'Trump': 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
    'Joe Biden': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg',
    'Biden': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg',
    'Barack Obama': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg',
    'Obama': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg',

    // Anime characters (fallback; Neta takes priority)
    'Artoria Pendragon': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Artoria_Pendragon_%28Fate%29.png',
    'Artoria': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Artoria_Pendragon_%28Fate%29.png',
    'Saber': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Artoria_Pendragon_%28Fate%29.png',
  };

  if (predefinedPeople[characterName]) {
    console.log(`[Search] ✅ [Priority 3 - Predefined] Using image: ${predefinedPeople[characterName]}`);
    return predefinedPeople[characterName];
  }

  // ─── 【Priority 4】All methods failed — provide web search suggestions ─────────────────
  console.log('[Search] ❌ All automated search methods found no image');
  console.log('[Search] ─────────────────────────────────────');
  console.log('[Search] 💡 Suggested web search queries to find an image:');

  // Generate search suggestions
  const searchQueries = [
    `${characterName} ${from.replace(/[《》]/g, '')} official image`,
    `${characterName} official portrait`,
    `${characterName} wiki`,
    `${from.replace(/[《》]/g, '')} ${characterName} character art`,
  ];

  console.log('[Search] Recommended search queries:');
  searchQueries.forEach((q, i) => {
    console.log(`[Search]   ${i + 1}. ${q}`);
  });

  console.log('[Search] ─────────────────────────────────────');
  console.log('[Search] 📌 Possible causes:');
  console.log('[Search]   - Character not found in the Neta database');
  console.log('[Search]   - Character name is not accurate or complete enough');
  console.log('[Search]   - Image URL has expired or is inaccessible');
  console.log('[Search] 📌 Solutions:');
  console.log('[Search]   1. Use the above queries for a web search');
  console.log('[Search]   2. Manually provide a character image URL');
  console.log('[Search]   3. Check that NETA_TOKEN is configured correctly');

  return null;
}

/**
 * Search Wikipedia / public image
 * @param {string} characterName - Character name
 * @param {string} from - Work title
 * @returns {Promise<string|null>} Image URL
 */
async function searchWikiImage(characterName, from) {
  // Strategy 1: predefined real-person mapping
  const wikiMap = {
    'Donald Trump': 'Donald_Trump',
    'Trump': 'Donald_Trump',
    'Joe Biden': 'Joe_Biden',
    'Biden': 'Joe_Biden',
    'Barack Obama': 'Barack_Obama',
    'Obama': 'Barack_Obama',
  };

  const wikiName = wikiMap[characterName];
  if (wikiName) {
    const wikiUrls = {
      'Donald_Trump': 'https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg',
      'Joe_Biden': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg',
      'Barack_Obama': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg',
    };
    const wikiUrl = wikiUrls[wikiName];
    if (wikiUrl) {
      console.log(`[Wiki] Using predefined Wikipedia image: ${wikiName}`);
      return wikiUrl;
    }
  }

  // Strategy 2: Try generic Wikipedia URL format (fictional characters)
  // e.g. Harry Potter → Harry_Potter_(character)
  const cleanName = characterName.replace(/[·\s]/g, '_');
  const wikiCandidates = [
    // Try character name + work title
    `https://upload.wikimedia.org/wikipedia/en/thumb/${cleanName}.png/220px-${cleanName}.png`,
    // Try Fandom Wiki format
    `https://static.wikia.nocookie.net/${from.replace(/[《》\s]/g, '').toLowerCase()}/images/${cleanName}.jpg`,
  ];

  // Validate these URLs
  for (const url of wikiCandidates) {
    try {
      const isValid = await isValidImageUrl(url);
      if (isValid) {
        console.log(`[Wiki] Found generic Wikipedia image: ${url}`);
        return url;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  console.log('[Wiki] No Wikipedia image found');
  return null;
}

/**
 * Search for character image via OpenClaw web_search
 */
async function searchCharacterImageViaOpenClaw(characterName, from) {
  // This requires calling the web_search tool in the OpenClaw environment
  // Example query: "{characterName} {from} official image"

  const query = `${characterName} ${from} official image anime character`;

  console.log(`[Search] Query: ${query}`);

  // TODO: Call OpenClaw web_search tool
  // const results = await web_search({ query, count: 5 });

  // Extract image URL from results
  // Return the first valid image URL

  return null;
}

/**
 * Full profile update flow
 *
 * @param {Object} charData - Character data
 * @param {string} guildId - Server ID
 */
async function updateDiscordProfile(charData, guildId) {
  const results = {
    nickname: false,
    avatar: false,
    errors: [],
  };

  try {
    // 1. Update nickname
    if (charData.character) {
      await updateNickname(guildId, charData.character);
      results.nickname = true;
    }
  } catch (err) {
    results.errors.push(`Nickname update failed: ${err.message}`);
  }

  try {
    // 2. Search and update avatar
    if (charData.character && charData.from) {
      const imageUrl = await searchCharacterImage(charData.character, charData.from);

      if (imageUrl) {
        await updateAvatar(imageUrl);
        results.avatar = true;
      } else {
        results.errors.push('Character image not found');
      }
    }
  } catch (err) {
    results.errors.push(`Avatar update failed: ${err.message}`);
  }

  return results;
}

// ─── Alternative: Using OpenClaw exec ─────────────────────────────────
/**
 * Use OpenClaw exec tool to call the Discord API
 *
 * This requires OpenClaw to support the exec tool
 */
async function updateProfileViaExec(guildId, charData) {
  const { exec } = require('child_process');

  return new Promise((resolve, reject) => {
    // Use curl to call the Discord API
    const commands = [];

    // Update nickname
    if (charData.character) {
      commands.push(
        `curl -X PATCH https://discord.com/api/v10/guilds/${guildId}/members/@me` +
        ` -H "Authorization: Bot ${TOKEN}"` +
        ` -H "Content-Type: application/json"` +
        ` -d '{"nick":"${charData.character}"}'`
      );
    }

    // Execute commands
    exec(commands.join(' && '), (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// ─── Exports ──────────────────────────────────────────────────────────
module.exports = {
  updateNickname,
  updateAvatar,
  searchCharacterImage,
  updateDiscordProfile,
  callDiscordAPI,
};
