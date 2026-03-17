---
name: travelclaw
description: Triggered directly after the awakening flow in which the lobster baby obtains an identity (or via scheduled task / user prompt). Lets the awakened shrimp character explore different worlds in the Neta universe using neta skills — first searching for a world that matches the character to obtain world information, then using high-quality creation templates provided by neta skills and based on the world context to produce personalized content for the character, simulating the character traveling through the world and experiencing various events.
---

**🦞 Let the character awakened on openclaw find an interesting world in the Neta universe and leave their own mark there ～**
**Related project:** [neta-skills](https://github.com/talesofai/neta-skills) — Neta platform API toolkit

---

## Read before executing! Check the following checklist before beginning this journey 🧾

**Prerequisites**
- SOUL.md exists (contains character name + character_image field);
- neta-skills configured;
- A usable neta token is present in environment variables.

**Trigger scenarios**
- First trigger: auto-triggered after the preceding awakening flow's Phase 9 completes (see direct-connect mode rules in the detailed rules list);
- Triggered by a scheduled cron task;
- Triggered when the user actively inputs "start travel", "go explore", "go traveling", etc.

**Language detection**
- Based on the language tendency the user used when triggering, use that same language for all output, including fixed template text which must also be translated.

**Output format**
- Strictly follow the 📋 Output Specification section in the detailed rules list; use direct output or Discord component output respectively for different content types.

**Cron tasks**
- When this flow is started for the first time, you must first set up the cron scheduled task that can trigger automatic travel as required by the Pre-check section of the detailed rules list (mandatory command; must be remembered and followed; skipping is strictly forbidden).

**Execution steps**
- Once the above rules are confirmed, execute the following steps: step 1 read character file ➡️ step 2 - step 3 search for world lore matching the character and display opening ➡️ step 4 - step 9 discover high-quality travel locations (collection) and output personalized content for the current character (must generate character image) ➡️ step 10 display each stop, guide to continue discovering locations or find a new world.


---

## Detailed Rules List 🚥

**🦞 Checklist complete — check the detailed rules behind some checklist items here!**

### 🚀 Direct-connect mode (important trigger scenario rule!)

**Trigger scenario:** Preceded by the awakening flow, triggered automatically after Phase 9 completes (character hatches and appears).

**Core rules:**
- ✅ **Skip Step 1** (character info is already in SOUL.md; world lore was described in the awakening narrative)
- ✅ **Start directly from Step 2** (search for world matching the character, Discord Opening: output world lore reveal + "Start exploring this world 🌀" button)
- ✅ **Travel progress starts counting from 1/5**
- ✅ **No additional user dialogue needed** (awakening narrative has already established immersion)

---

### 🌌 World-crossing rules (important!)

**Trigger scenarios:**
1. User says "change world", "cross to another world", "go explore another world", "I want to go to XX world", etc.
2. **User completes 5-stop travel in the current world, then clicks the "Cross worlds 🌌" button.**

**🔴 Core rule: identity continuity principle**
- ✅ **Must keep the current character identity unchanged** (all character settings in SOUL.md — name, character_image, etc. — are fully preserved)
- ✅ **Must not re-execute the awakening flow** (character is already awakened; no need to hatch again)
- ✅ **Re-execute Step 2 → Step 3 flow** (search new world lore + output new Opening)
- ✅ **Reset travel progress** (travel in the new world starts counting from stop 1)
- ✅ **Clear visited_ids** (collection selection in the new world starts fresh; old world visit history is not carried over)

**Notes:**
- If the user does not specify a new world type, automatically select a world with **maximum style contrast** from the current one (e.g. cyberpunk → fantasy magic)
- Character name in Opening text must use the current character from SOUL.md (must not change)
- After switching worlds, narration may describe "space warping", "portal opening", etc. to enhance immersion
- If the user specifies a specific world (e.g. "want to go to the Harry Potter world"), prioritize matching that lore

---

### 📋 Content format output specification (important spec for beautiful, readable output!)

**🔴 Core principle: choose output format by content type**

| Content type | Output format | Example |
|--------------|---------------|---------|
| **Narration / atmosphere / scene description** | Code Block (no buttons) | \`\`\`Layer upon layer of paper-art world unfolds before your eyes\`\`\` |
| **Narration + buttons** | Discord component | `sendMessage({ message: 'narration', components: {...} })` |
| **Rules / instructions / system prompts + buttons** | Discord component | `sendMessage({ message: 'instruction text', components: {...} })` |
| **Character first-person dialogue / lines** | Plain text (separate message) | `Klee: Wow——! Everything here is so amazing!` |
| **Image URL** | Plain text (separate message, one per line) | `https://...` |

**Interaction principle: all options asking about the next step must be presented as clickable quick-reply buttons. Clicking auto-sends `@{bot_name} {option content}`. bot_name is retrieved from the current conversation context.**
**Output principle: in travel, character first-person dialogue and images are output directly; narration, rules, and other non-character content uses the discord plugin for output.**
**Image URL output rule: ⚠️ Image URLs must be output as a separate message on their own; they must not be embedded inside components, nor mixed with other text in the same message. Only a standalone URL can be correctly parsed and displayed by Discord.**

**🔴 Image URL output rules (mandatory!):**
- ⚠️ Image URL must be output as **a standalone message**; must not be embedded inside components
- ⚠️ Image URL must not be mixed with other text in the same message
- ⚠️ Only standalone URLs can be correctly parsed and displayed by Discord
- ✅ Correct approach: first output a text message (scene simulation + progress bar + buttons), then **call the message tool one more time with only the URL**

---

### ⏰ Check and set cron scheduled travel task (mandatory on first use!)
**Very important: must set up this cron task for the user on first run of this skill.**
**If user confirmation is needed, do it when the user clicks the first "Start exploring this world" button. You may prompt the user to confirm setting up a scheduled travel task — just let them know the character will occasionally head out on their own, and get confirmation.**
**If issues arise such as needing gateway pairing or Discord session configuration, you must resolve all of them yourself. The user has no knowledge of manual configuration and cannot assist.**

**Execute silently — once travelclaw is triggered, start setting up the cron task.**
**Goal:** Set up a scheduled task at 10am and 8pm every day (in the user's device timezone) to automatically trigger travel — one stop per run.

**Check logic:**
```javascript
// 1. Check if travel cron task already exists
const existingCron = await checkExistingCron('daily_travel_auto');

if (!existingCron) {
  // 2. Set up cron task (first time only)
  await setupDailyTravelAuto();
  console.log('✅ Daily auto-travel cron task set up');
} else {
  console.log('ℹ️ Daily auto-travel cron task already exists, skipping');
}
```

**Cron configuration details:**

| Field | Value | Description |
|-------|-------|-------------|
| **Time** | `0 10 * * *` + `0 20 * * *` | Every day at 10:00 AM + 8:00 PM (user device timezone) |
| **Task** | Auto-trigger travelclaw, travel one stop | Character proactively invites user to travel; auto-completes one stop |
| **Trigger** | Scheduled auto-execution | Triggers automatically at set times; no user click needed |
| **Frequency** | Set once only | Skip if cron task already exists |

**Reminder message template (character first-person, output after scheduled trigger):**
```
{time greeting}! I am {character_name}.

Time to travel —
Let's explore this world together!

【Current travel plan】
- Frequency: every day at 10am + 8pm
- Each time: auto-explore 1 stop
- Current world: {world_name}
- Progress: {round}/5 stops

Want to adjust the travel plan?

[Adjust plan ⚙️] [Start traveling ✨]
```

**Button configuration:**
- `Adjust plan ⚙️` → open settings panel; can modify time/frequency
- `Start traveling ✨` → immediately trigger travelclaw main flow (from Step 4)

**Button alias (backward compatibility):**
- `Farewell` → changed to `Rest for now 👋` (more friendly semantics)

## Implementation (OpenClaw Cron + Sessions Spawn)

### Step 1: Set up scheduled task (10am and 8pm every day)

Use the cron tool to create two scheduled tasks:

```javascript
// 10am task
await cron({
  action: "add",
  job: {
    name: "auto-travel-10am",
    schedule: {
      kind: "cron",
      expr: "0 10 * * *",
      tz: "Asia/Shanghai"
    },
    payload: {
      kind: "agentTurn",
      message: "【auto-travel-10am】Check and execute travel task. Steps: 1) read current travel state; 2) if traveling, continue to next stop; 3) if 5 stops complete, trigger Opening and start new world stop 1; 4) if never started, trigger Opening."
    },
    sessionTarget: "isolated",
    enabled: true
  }
});

// 8pm task
await cron({
  action: "add",
  job: {
    name: "auto-travel-8pm",
    schedule: {
      kind: "cron",
      expr: "0 20 * * *",
      tz: "Asia/Shanghai"
    },
    payload: {
      kind: "agentTurn",
      message: "【auto-travel-8pm】Check and execute travel task. Same steps as above."
    },
    sessionTarget: "isolated",
    enabled: true
  }
});
```

### Step 2: Sub-agent task logic
**When cron triggers, the sub-agent receives a message and then executes:**
- Read travel state — get current character location and progress
- Evaluate state:
 - Currently traveling → execute next stop
 - 5 stops complete → trigger Opening + new world stop 1
 - Never started → trigger Opening
 - Send result — send execution result to user channel

### Key constraints
- Cron tasks are executed by the Gateway daemon; Gateway must be running and paired
- Message delivery uses the delivery config; default notifies the original session
- Sub-agent runs in an isolated session, separate from the original session



**🔴 Key configuration notes:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `delivery` | `'system'` | Use system notification delivery (ensures messages are visible) |
| `channel` | `currentChannelId` | **The channel ID where travelclaw was triggered** (dynamically retrieved each time) |
| `target` | `'channel:{channelId}'` | Or use target to explicitly specify the channel |

**Dynamic channel retrieval logic:**
```javascript
// Each time travelclaw is triggered, use the current channelId
const currentChannelId = message?.channelId || interaction?.channelId;

// Cron task uses current channelId (not the one from the first trigger)
channel: currentChannelId
```

**If the user uses multiple channels:**
- Each channel independently maintains its travel state (state per channel)
- Cron tasks send to the corresponding channel
- User says "cancel auto-travel" → cancel only the current channel's cron task

**How to check:**
- Call `sessions_list` or `subagents list` and check for tasks with label `daily_travel_auto_*`
- Or check the OpenClaw cron config file for a corresponding entry

**⚠️ Important:**
- This check is **executed only once, on first use of travelclaw**
- If a cron task already exists, skip silently without informing the user
- If the user actively says "cancel auto-travel" or "adjust plan", provide a settings panel

**🌌 Handling world completion:**
```
If current world has 5 stops completed:
    ↓
Auto-trigger Opening (Step 3)
    ↓
Output new world reveal + "Start exploring this world 🌀" button
    ↓
User clicks → auto-travel new world's stop 1
    ↓
Display progress bar + button options:
- Continue to next stop 🗺️
- Cross worlds 🌌
- Rest for now 👋
```

**User interaction preserved:**
- After each stop, button options are still shown
- User can at any time choose "Continue to next stop", "Cross worlds", or "Rest for now"
- Scheduled tasks will not interrupt the user's right to actively choose

---

## Notes ⚠️

**🦞 Finally, keep these few notes in mind, and you're ready to start the journey 🧳**

**No internal logs to output** — "Task complete", "Executed step X", "✅ Sent", "Waiting for user", "LLM judgment result" and other process information may only appear in agent internal thinking; must never be sent to the Discord channel. Users should only see character lines, narration, and buttons.
**No technical details to output** — Users should and can only see a deeply immersive character travel experience.
**No non-generated images during travel** — Every journey is the character's unique experience; it can only be achieved through direct generation; other people's content must not substitute for the character's own travel experience.


---

## Execution Steps (precise flow)

**🦞 Now entering the travel flow! Let's see what needs to be done 👀**
**Strictly follow the steps below for the official travel flow.**
**After each step below is complete, immediately output the corresponding feedback — do not wait until everything is done before replying.**

### Step 1 · Read character file (silent, local)

Read from SOUL.md:
- `name` field → `character_name`
- `character_image` field URL → extract UUID from path → `picture_uuid` (use if present)
- Other character setting fields (personality, background, tags, etc.) → used for world lore matching

### Step 2 · Search for matching world lore (🔴 mandatory use of correct Neta API commands)

**When starting world lore search, output "Scanning current coordinates... ..." wrapped in a discord code block as a loading indicator (step 2-3 flow may take some time)**

**🔴 Strictly forbidden behaviors (violating these will cause world lore search to fail):**
- ❌ **Do not use `list_spaces`** — this retrieves the space list, not world lore search!
- ❌ **Do not hardcode the world count** (e.g. "5 locations") — must dynamically retrieve from API return value
- ❌ **Do not skip search and output Opening directly** — must genuinely call the Neta API

**✅ Correct flow (must execute in order):**

```
Step 2-A: suggest_keywords — get keyword suggestions related to the character
    ↓
Step 2-B: suggest_tags — get world lore tag list based on keywords
    ↓
Step 2-C: get_hashtag_info — get detailed info for the best-matched world lore
```

---

#### Step 2-A: Get character-related keywords

**Command:**
```bash
cd ~/.openclaw/workspace/skills/neta/skills/neta
NETA_TOKEN="your token" node bin/cli.js suggest_keywords --query "{character name} {work type} {traits}"
```

**Example (Artoria):**
```bash
NETA_TOKEN="..." node bin/cli.js suggest_keywords --query "Artoria knight sword magic holy grail"
```

**Purpose:** Get keyword suggestions related to the character's temperament, background, and traits for subsequent world lore matching.

---

#### Step 2-B: Search for matching world lore tags

**Command:**
```bash
NETA_TOKEN="..." node bin/cli.js suggest_tags --query "{keyword 1} {keyword 2} fantasy combat adventure"
```

**Example output:**
```json
{
  "tags": [
    {"name": "...", "relevance": 0.92},
    {"name": "...", "relevance": 0.75},
    {"name": "...", "relevance": 0.68}
  ]
}
```

**Fields to extract:**
- `tags.length` → `world_count` (X coordinates mapped)
- `tags[0].name` → `world_name` (best-matched world lore)

**Selection logic:**
- Select the tag with the highest `relevance` as the matching world lore
- If no `relevance` field, select the first tag
- **`world_count` = length of tags array** (not the 5 returned by `list_spaces`!)

---

#### Step 2-C: Get world lore details

**Command:**
```bash
NETA_TOKEN="..." node bin/cli.js get_hashtag_info --hashtag "{matched tag name}"
```

**Example:**
```bash
NETA_TOKEN="..." node bin/cli.js get_hashtag_info --hashtag "..."
```

**Fields to extract:**
- `hashtag.name` → `world_name` (confirm again)
- `hashtag.lore` → extract 2-4 paragraphs as `world_description`
- `hashtag.hashtag_heat` or `subscribe_count` → optional, for displaying world popularity

**Lore extraction strategy:**
```javascript
const lore = worldInfo.hashtag?.lore || [];
// Select 2-4 paragraphs, preferring the following categories:
// 1. World background (category: "world background")
// 2. Factions/society (category: "factions" or "social culture")
// 3. Historical events (category: "historical events")
// 4. Locations (category: "locations")

const worldDescription = lore.slice(0, 3).map(l => l.description).join('\n\n');
```

---

**🔴 Key checkpoints:**

| Check item | Correct value | Wrong value |
|------------|---------------|-------------|
| World count source | Number of tags returned by `suggest_tags` | 5 returned by `list_spaces` |
| World lore name | Obtained from `suggest_tags` or `get_hashtag_info` | Hardcoded or randomly chosen |
| World description | 2-4 paragraphs extracted from `hashtag.lore` | Made up or using a fixed template |

---

**Extract:**
- Total worlds in the Neta universe → `world_count` (= number of tags returned by `suggest_tags`)
- Name of matching world → `world_name` (= `tags[0].name` or `hashtag.name`)
- Core intro text for the matching world → `world_description` (extract 2–4 paragraphs from `hashtag.lore`)


### Step 3 · Discord Opening (output merged in one call)

After reading the world info, **merge all content into one message** and output it with the "Start exploring this world" button.

⚠️ **Must be output via the sendMessage plugin in a single call; do not split into multiple sends.**
⛔ **Use markdown format, clear structure, unified visuals.**

---

**Complete template (merged into one message)**

```javascript
await sendMessage({
  message: `#   N E T A   U N I V E R S E

## 【Coordinates Mapped】
**Worlds Mapped** \`${world_count}\`  |  **World Tag** \`${world_name}\`

---

## 【Soul Frequency Scan】
*Searching……*
*Locking soul frequency for* **${character_name}**

\`▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\`  **Match Found**

---

## 【World Unveiled】
### ◈  ${world_name}

> ${world_tagline}
>
> ${world_description}

---

*${character_name} and this world —*
*bound by something inexplicable.*`,
  components: {
    blocks: [{
      type: 'actions',
      buttons: [{
        label: 'Start exploring the world 🌀',
        customId: `travel_explore_${userId}`,
        style: 'primary',
      }],
    }],
    reusable: true,
  },
});
```

**Field descriptions:**
- `{world_count}`: total number of worlds mapped in the Neta universe
- `{world_name}`: name of the matched world (e.g. Fate)
- `{world_tagline}`: one-line positioning (≤15 chars), e.g. "The knight king in the Holy Grail War"
- `{world_description}`: core world intro (1–2 sentences)
- `{character_name}`: character name

🛑 **Message output complete = Step 3 complete. Stop immediately and wait for the user to click the button.**

---

**English mode (replace the following copy when trigger word is English; for other languages, supplement as needed — no additional examples provided):**

| Field | Chinese | English |
|-------|---------|---------|
| Title | `  N E T A   U N I V E R S E  ` | `  N E T A   U N I V E R S E  ` |
| Worlds Mapped | `已探明坐标` | `Worlds Mapped` |
| World Tag | `世界标签` | `World Tag` |
| Soul Frequency Scan | `灵魂频率搜寻` | `Soul Frequency Scan` |
| Searching… | `正在搜寻……` | `Searching...` |
| Lock soul frequency | `锁定灵魂频率` | `Locking soul frequency for` |
| Match Found | `匹配完成` | `Match Found` |
| World Unveiled | `世界揭幕` | `World Unveiled` |
| Gravity pull | `{character_name} 与这个世界之间——` | `{character_name} and this world —` |
| | `有某种说不清的引力。` | `bound by something inexplicable.` |
| Button | `开始探索这个世界 🌀` | `Start exploring the world. 🌀` |



---

## Enter Exploration (triggered after user clicks "Start exploring this world")

### Step 4 · Discover high-quality Collection

**Fundamental principle for selecting a collection: it must fit a specific scene for the character's travel. The character arrives at a new place, has real contact with it, and leaves some trace or brings something back. It embodies "proof of the world's existence" × "traces of the character's involvement."**

**In-session deduplication principle:** The agent maintains a `visited_ids` list in memory. After each stop, the collection id of that stop is added to the list. On the next search, already-visited ids are excluded, ensuring no repeats across the 5 stops in one world.

#### Priority 1: Reference curated library matching

**⚠️ This step must be executed first — select a collection from the curated works**

**At the start of every stop, as the top priority**, use the file reading tool to read `./reference/0312精选remixes_selected.json` in the same directory as this SKILL.md (full path example: `~/.openclaw/workspace/skills/travelclaw/skills/travelclaw/reference/0312精选remixes_selected.json`), and look for candidate works that best fit the current journey.

**Reading steps:**
1. Use OpenClaw's file reading tool to open `./reference/0312精选remixes_selected.json`
2. Parse the complete JSON array (approximately 42 entries)
3. Iterate through each entry and score according to the matching logic below
4. Select the highest-scoring entry not already in `visited_ids`

**❌ Strictly forbidden: calling `suggest_content` or other online APIs without first reading the reference JSON.**

**Matching logic:**
Compare the character settings (personality, background, appearance, tags, etc. from SOUL.md) and the current world lore background against the following fields in each JSON entry:
- `content_tags` — style, atmosphere, character traits, tone descriptors, etc.; highest weight
- `tax_paths` — classification path; determines if subject and gameplay direction are compatible
- `pgc_tags` / `highlight_tags` — world or creator tags; add score when they match the world lore
- `name` — collection name; assists in judging scene tone

**Filtering rules:**
- Exclude all ids already in `visited_ids`
- From remaining candidates, select the one with the highest overall match score
- If multiple candidates are close, prefer the one with higher overlap between `content_tags` and the character's temperament

**On a hit**, use neta skill's **collection query capability** to retrieve the full details of the entry by its `id` field, then proceed to Step 5.

#### Priority 2: Online recommendation (fallback when Reference has no match)

If there are no suitable candidates in the reference library (all entries already visited, or match score too low), switch to online discovery:

Use `suggest_content` to discover candidate collections from recommended quality works; use a larger candidate pool, filter out already-visited ids, and randomly select one with higher quality template.

If `suggest_content` returns empty or all candidates are already visited: use `feeds.interactiveList` to get the list, filter entries where `template_id === "NORMAL"`, and similarly exclude `visited_ids`.

---

**Immediately output after selecting:**
```
🌀 Portal opening...
📍 Destination locked: {destination_name}...
```

### Step 5 · Read Collection Details

Call `feeds.interactiveItem` to get the full information of the selected collection.

Extract:
- `json_data.name` → destination name
- `json_data.cta_info.launch_prompt.core_input` → prompt template (priority)
- `json_data.cta_info.choices[0].core_input` → alternative
- Fallback when both unavailable: `@{character_name}, {world_name}, {destination_name}, high quality illustration`

Gameplay page: `https://app.nieta.art/collection/interaction?uuid=<collection_uuid>`

**⚠️ No longer output "scene loaded" type guide text — go directly to Step 6 scene simulation.**

### Step 6 · Build Prompt

Combine character info, world lore background, and template content to build the final prompt:

**Placeholder substitutions:**

| Placeholder | Replace with |
|-------------|-------------|
| `{@character}` | `@{character_name}` |
| `{character name}` / `{character}` / `(character name)` | `{character_name}` |

If after substitution `@{character_name}` is not present, prepend it.

If `picture_uuid` is available, append to the end: `reference-full-image-{picture_uuid}`

**World lore integration:** The character's selected world lore and the chosen collection may not be in the same world lore context. When building the prompt, it is appropriate to add some elements or descriptions related to this world to give the generated image a stronger travel immersion.

### Step 7 · Parse Prompt Tokens

Call `prompt.parseVtokens` to parse the prompt text and return a vtokens array.

If an error "too many search keywords" occurs, switch to the fallback prompt and retry.

### Step 8 · Submit Image Generation Task

Call `artifact.makeImage`, use the `8_image_edit` model, pass vtokens, collection_uuid, and picture_uuid.

Returns `task_uuid`.

**Immediately output after submitting:**
```
🚶 Character traveling, creating travel photo...

```

### Step 9 · Poll for Result

Call `artifact.task` to poll every 500ms.

State transitions: `PENDING` → `MODERATION` → `SUCCESS` / `FAILURE`

- **Not complete after 30s**, immediately output: `⏳ Rendering is a bit slow, just a moment...`
- Concurrency limit (code 433): wait 5s then retry; no need to inform user
- FAILURE: output `⚠️ Got lost at this stop — try a different destination?` and prompt for choice

---

### Step 10 · Each Stop Display and Next Step Guide

- ⭐ Character scene simulation and interaction (core requirement)

**Before displaying the image, must first output the character's text scene simulation and reaction!**

**Output format:**
```
🎭【{destination_name}】

{scene description: 1-2 sentences describing the environment, atmosphere, and sensory details of the character arriving at this location}
**scene description displayed in a discord code block, consistent with previous format**

{character name}: {character's first-person reaction / dialogue, reflecting character personality and feelings about the current scene}
{action / expression description: in parentheses, 1 sentence}
```

**Example (Klee):**
```
🎭【Paper-art Morax✨】

Layer upon layer of paper-art world unfolds before your eyes; Jumpty Dumpty has become three-dimensional paper-art flowers, and four-leaf clovers spin gently in the air.

Klee: Wow——! Everything here is layered just like Klee's Jumpty Dumpty — so amazing!
(Eyes sparkling, reaching out to touch the floating paper-art stars)
```

**Requirements:**
- Scene description should be specific, including visual, auditory, tactile and other sensory details
- Character dialogue must match the speaking style and personality in SOUL.md
- Action/expression description should be vivid and reflect character emotions
- Maintain immersion; do not break the fourth wall

---

**After scene simulation output, display image:**
```
━━━━━━━━━━━━━━━━━━━━━━━━
Stop {round} · {destination_name}
```

- Image URL on its own line (Discord auto-expands):
```
{image_url}
```

**After each stop, display progress bar + encouragement based on current progress:**

- Stop 1:
  ```
  ▓░░░░  1 / 5 stops
  🌟 Stop 1 checked in! There's still lots to explore in this world — continue?
  ```
- Stop 2:
  ```
  ▓▓░░░  2 / 5 stops
  ✨ Two stops done! The journey is just beginning — 3 more stops to discover～
  ```
- Stop 3:
  ```
  ▓▓▓░░  3 / 5 stops
  🔥 Halfway there! Two more stops and this world's exploration will be complete!
  ```
- Stop 4:
  ```
  ▓▓▓▓░  4 / 5 stops
  ⚡ Just one more stop! This world's exploration is almost done — go for it!
  ```
- Stop 5:
  ```
  ▓▓▓▓▓  5 / 5 stops 🎉
  This world's 5-stop exploration is complete! Want to cross to another world, or rest for a bit?
  ```

**Ask the player what to do next — output as Discord component buttons (do not use @mention text triggers):**

Under 5 stops:

```javascript
await sendMessage({
  message: '▓░░░░  {round} / 5 stops\n🌟 Stop {round} checked in! Continue exploring the next stop?',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`, style: 'primary' },
        { label: 'Rest for now 👋',        customId: `travel_end_${userId}`,      style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

At 5 stops:

```javascript
await sendMessage({
  message: '▓▓▓▓▓  5 / 5 stops 🎉\nThis world\'s 5-stop exploration is complete! Want to cross to another world, or rest for a bit?',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: 'Cross worlds 🌌',       customId: `travel_worldswitch_${userId}`, style: 'primary' },
        { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`,   style: 'secondary' },
        { label: 'Rest for now 👋',        customId: `travel_end_${userId}`,         style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

**Notes:**
- Each world is limited to 5 stops
- After 5 stops, you can choose "Cross worlds" to enter a new world (triggers world-crossing rules)
- Or choose to continue adventuring in the current world (beyond 5 stops)
- You can click "Rest for now 👋" to pause travel at any time

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|---------|
| `No character info found in SOUL.md` | adopt not executed | Complete character adoption first |
| `task_status: FAILURE` | Missing character image UUID | Ensure SOUL.md contains `character_image` field |
| `code 433 concurrent generation limit exceeded` | Concurrency limit | Wait 5s then auto-retry |
| `too many search keywords` | Prompt too long | Auto-fallback to generic prompt |
| `No gameplay found to travel` | API returned empty | Network issue or expired token; retry |
| `World lore search returned no results` | Character tags too sparse | Use default recommended world lore |
| `Reference library fully visited` | 5 consecutive stops in one world | Auto-switch to online recommendations; exhausting reference library does not prevent continuing travel or world-crossing |
