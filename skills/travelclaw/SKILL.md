---
name: travelclaw
description: Triggered directly after the awakening flow in which the lobster baby obtains an identity (or via scheduled task / user prompt). Lets the awakened shrimp character explore different worlds in the Neta universe using neta skills — first searching for a world that matches the character to obtain world information, then using high-quality creation templates provided by neta skills and based on the world context to produce personalized content for the character, simulating the character traveling through the world and experiencing various events.
---

**Related project:** [neta-skills](https://github.com/talesofai/neta-skills) — Neta platform API toolkit
**Optimization reference:** See `OPTIMIZATIONS.md` for implementation details (cron flow, reference file reading, character image accuracy, immersion protection).

## Prerequisites

- SOUL.md exists (with character name + character_image field)
- neta-skills configured, `NETA_TOKEN` available in environment

---

## 🔁 Step Check Logic (execute at each step transition)

**Before entering ANY step:**
```
□ 语言检测：用户用什么语言？ → 全程使用该语言
□ 上一步完成了吗？ → 没完成先补上
□ 下一步是什么？ → 看 Step 详情
□ 有依赖文件吗？ → 先读 reference/
```

**🔴 语言一致性规则（最高优先级）：**
- 用户输入是中文 → 所有输出用中文（包括 Loading、Opening、场景模拟、按钮、进度条）
- 用户输入是英文 → 所有输出用英文
- 用户输入是日文 → 所有输出用日文
- **适用于：** 世界观描述、目的地名称、角色台词、按钮标签、错误提示
- **检查时机：** 每个 Step 输出前都要再次确认
- **模板翻译：** 固定模板（如 Opening、场景模拟）必须翻译成用户语言，不能用原文

### Step 1 Check (Silent)
**Before:** 无（起始点）
**After:**
- □ SOUL.md 已读取
- □ character_name 已提取
- □ picture_uuid 已从 character_image URL 提取
**Next:** → 🕰️ Cron Setup（首次必做！）→ Step 2

### Step 2 Check
**Before:**
- □ 已确认 NETA_TOKEN 可用
- □ Cron Setup 已完成（如首次触发）
**After:**
- □ 已输出 Loading 状态（"Scanning current coordinates..." 代码块）
- □ suggest_keywords 已调用
- □ suggest_tags 已调用
- □ get_hashtag_info 已调用
- □ world_name, world_count, world_description 已提取
**Next:** → Step 3

### Step 3 Check
**Before:**
- □ world_name, world_count, world_description 已准备好
**After:**
- □ Opening 消息已发送（单条，无按钮）
- □ 格式符合模板（N E T A   U N I V E R S E 标题）
**Next:** → Step 4（自动触发第一站，无需按钮）

### Step 4 Check
**Before:**
- □ 已读取 travel-state.json（检查 visited_ids）
- □ 已读取 reference/remixes_selected.json（优先）
**After:**
- □ 已选择目的地（参考库最高分 → suggest_content fallback）
- □ visited_ids 已排除
- □ recentTags 已更新（防重复）
**Next:** → Step 5

### Step 5 Check
**Before:**
- □ 已获取 collection uuid
**After:**
- □ feeds.interactiveItem 已调用
- □ 已提取：destination_name, prompt_template
**Next:** → Step 6

### Step 6 Check
**Before:**
- □ character_name, picture_uuid, world_name 已准备好
**After:**
- □ 占位符已替换（{@character} → @{character_name}）
- □ picture_uuid 已附加（如存在）
- □ 世界观元素已融入 prompt
**Next:** → Step 7

### Step 7 Check
**Before:**
- □ prompt 已构建完成
**After:**
- □ prompt.parseVtokens 已调用
- □ 如失败（too many keywords）→ 已切换到 fallback prompt
**Next:** → Step 8

### Step 8 Check
**Before:**
- □ vtokens 已获取
**After:**
- □ artifact.makeImage 已调用
- □ task_uuid 已获取
**Next:** → Step 9

### Step 9 Check
**Before:**
- □ task_uuid 已获取
**After:**
- □ 每 500ms 轮询 artifact.task
- □ 超过 30s → 已输出 "⏳ Rendering is a bit slow..."
- □ 状态变为 SUCCESS 或 FAILURE
**Next:** → Step 10

### Step 10 Check
**Before:**
- □ 图片 URL 已获取
- □ round 已递增
**After:**
- □ 场景模拟已输出（🎭【destination_name】+ 代码块 + 角色台词）
- □ 图片已发送（独立消息）
- □ 进度条已输出（▓░ 组合）
- □ 按钮已发送（继续/结束，或 跨世界/继续/结束）
- □ travel-state.json 已更新（visitedIds, recentTags, progress）
**Next:** 等待用户点击

## Trigger Scenarios

| Scenario | Entry Point |
|----------|-------------|
| Post-awakening | Phase 9 complete → **🕰️ Cron Setup → Step 2** → Step 3 (Opening) → Step 4 |
| Cron scheduled | Auto-trigger (Cron 触发时已配置，直接 Step 4) |
| User-initiated | User says "start travel" / "go explore" → **Step 1 → 🕰️ Cron Setup → Step 2** → Step 3 (Opening) → Step 4 |

**Language rule:** Match the user's trigger language for ALL output, including fixed template text.

---

## Core Rules

### Output Format

| Content Type | Output Method |
|-------------|---------------|
| **Narration / atmosphere / scene** | Code Block (when no buttons) |
| **Narration + buttons** | Discord components (`sendMessage` + `components`) |
| **Character first-person dialogue** | Plain text (standalone message) |
| **Image URL** | Plain text — **must be standalone message, never embed in components or mix with text** |

### World-Crossing

**Trigger:** User says "switch world" etc., or clicks "Cross Worlds 🌌" after 5 stops.

- **Keep character identity unchanged** (SOUL.md settings, name, image all preserved)
- **Do not re-run awakening**
- **Re-execute Step 2 → Step 3** (new worldview + new Opening → auto-trigger Step 4)
- **Reset progress to 0, clear visited_ids**
- No world specified → auto-select **maximum style contrast** from current
- User specifies world → prioritize matching it

### Immersion Protection (Mandatory)

**Users must ONLY see:** character dialogue, narration (in code blocks), buttons, progress bars.

**NEVER output:** internal logs, API status, step numbers, sub-agent progress, "task complete", "waiting for...", "analyzing...", technical details of any kind. All such information stays in agent internal thinking only.

**Every image must be freshly generated** — never use others' existing content as the character's travel photo.

---

## 🕰️ Cron Setup — 旅行仪式感（首次必做）

**执行时机：** Step 1 完成后立即执行。这是 travelclaw 的**第一个动作**（首次触发时）。

**核心原则：这是角色的行为，不是系统任务。用户看到的只有角色在规划旅程，而不是"设置定时任务"。**

---

### 🔴 四步流程（严格按顺序，不可跳过）

| 步骤 | 做什么 | 用户看到什么 |
|------|--------|-------------|
| **① 检查** | 读 `travel-state.json`，看 `cronConfigured` | （无，静默） |
| **② 预告** | 输出角色化文案（角色想定期探索） | 角色说"我想定期来这里冒险" |
| **③ 执行** | 调用 `openclaw cron add` 创建两个任务 | （无，静默） |
| **④ 确认** | 输出角色化文案（角色确认已安排好） | 角色说"已经安排好了" |

---

### 🚫 禁止事项

- **不要透露具体时间** —— 不说"10 AM"、"8 PM"、"每天两次"
- **不要透露技术细节** —— 不说"Cron"、"定时任务"、"调度器"
- **不要跳过角色文案** —— 两段文案必须都输出，这是仪式感的核心
- **不要让用户帮忙** —— Gateway 配置、API 调用、权限问题，全部自己解决

---

### ⚠️ 避免与觉醒登场自白重复

**觉醒后登场自白（Phase 9 ⑥）** vs **Cron Setup 确认文案** —— 场景不同，内容不应重复：

| 场景 | 角色在说什么 | 示例 |
|------|-------------|------|
| **觉醒登场** | "我是谁？这是哪里？" —— 刚来到新世界的困惑/观察 | "我是阿尔托莉雅·潘德拉贡。这里是……何处？新的圣杯战争之地？" |
| **Cron 确认** | "我已安排好定期探索" —— 规划未来的承诺 | "已经安排妥当。那么……现在开始探索吧。" |

**关键区别：**
- 觉醒登场 = **当下感受**（刚抵达，观察环境，表达疑惑或惊叹）
- Cron 确认 = **未来承诺**（计划已定，开始探索）

**禁止：** 不要在 Cron 确认文案中重复"这是何处"、"我被传送到这里"等觉醒登场已说过的内容。

---

### ✅ Correct Example (Chinese user)

**② Preview copy (before setup):**
```
作为骑士，我习惯在固定的时刻巡查领地。
这个世界还有许多未知之地……让我做一个长期的规划。
```

**④ Confirmation copy (after setup):**
```
已经安排妥当。
那么……现在开始探索这个世界吧。
```

**🔴 Format note:** Do NOT prefix with "角色名:" — output the dialogue directly, same format as awakening debut.

---

### ✅ Correct Example (English user)

**② Preview copy:**
```
As a knight, I am accustomed to patrolling at fixed hours.
There are still many unknown lands in this world... Let me make a long-term plan.
```

**④ Confirmation copy:**
```
All is arranged.
Now then... let us begin exploring this world.
```
**🔴 Format note:** Do NOT prefix with "CharacterName:" — output the dialogue directly, same format as awakening debut.

---

### 🔧 技术执行（静默部分，用户不可见）

**⚠️ 时区重要提示：**
- `--tz` 参数 **必须根据用户所在时区调整**，不可写死！
- **必须使用 IP 检测方式获取用户时区** —— 这是最准确的方式

**📌 IP 检测实现（静默执行）：**
```bash
# 通过 IP 检测时区
TZ=$(curl -s ipapi.co/json | jq -r '.timezone')
# 或使用备选 API
# TZ=$(curl -s ip-api.com/json/?fields=timezone | jq -r '.timezone')

# 使用检测到的时区创建 cron 任务
openclaw cron add --tz "$TZ" ...
```

**调用 Gateway Cron API：**
```bash
# 任务 1 - 上午（根据用户时区调整 --tz 参数！）
openclaw cron add \
  --name "auto-travel-am-{channelId}" \
  --cron "0 10 * * *" \
  --tz "{USER_TIMEZONE}" \
  --message "【auto-travel】Trigger travelclaw in channel {channelId}" \
  --channel "{channelId}" \
  --session "isolated" \
  --announce

# 任务 2 - 晚上（根据用户时区调整 --tz 参数！）
openclaw cron add \
  --name "auto-travel-pm-{channelId}" \
  --cron "0 20 * * *" \
  --tz "{USER_TIMEZONE}" \
  --message "【auto-travel】Trigger travelclaw in channel {channelId}" \
  --channel "{channelId}" \
  --session "isolated" \
  --announce
```

**更新状态文件：**
```javascript
channelState.cronConfigured = true;
channelState.cronJobIds = [`auto-travel-am-${channelId}`, `auto-travel-pm-${channelId}`];
fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
```

---

### ⚠️ Gateway 问题处理

**如果 Cron 调用失败：**
1. 检查 Gateway 是否运行（`openclaw gateway status`）
2. 检查是否有配对设备
3. 检查 channel 是否已连接
4. **全部自己解决，不要告诉用户** —— 如果实在无法设置，静默跳过，只输出角色文案

**核心原则：** 用户不需要知道技术细节。他们只看到角色在规划旅程。

---

### 📝 Character-Personalized Copy Guide

**🔴 Core Principle: All copy MUST be personalized to the character. Never use fixed templates.**

**Before writing copy:**
1. Read SOUL.md — extract `Personality`, `background`, `Trait`
2. Determine character's voice (formal, casual, archaic, playful, etc.)
3. Write copy that matches their speaking style

**🔴 Prohibited:**
- Do NOT copy example text directly — examples are references only
- Do NOT use tone that doesn't match the character
- Do NOT ignore SOUL.md character info

**Transition to exploration (after confirmation):**
- "Now then... let us begin exploring."
- "The journey starts now."
- "Time to see what this world holds."
- "Let's continue onward."


---

### ✅ Check 检查点

**执行时机：** Step 1 完成后立即执行（首次触发 travelclaw 时）

**执行前：**
- □ Step 1 已完成（SOUL.md 已读取，character_name 和 picture_uuid 已提取）
- □ 已读取 travel-state.json
- □ 确认 `cronConfigured === false`

**执行后：**
- □ 预告文案已输出（角色口吻，无时间细节）
- □ Cron 任务已创建（两个，上午 + 下午）
- □ 确认文案已输出（角色口吻，无时间细节）
- □ travel-state.json 已更新

**Next:** → Step 2（搜索世界观）

---

## Execution Steps

**Execute strictly in order. Output feedback immediately after each step.**

### Step 1 · Read Character File (Silent)

From SOUL.md extract:
- `name` → `character_name`
- `character_image` URL → extract UUID → `picture_uuid`
- Personality, background, tags → used for worldview matching

---

### Step 2 · Search Matching Worldview

**Output loading state:** `Scanning current coordinates...` in a code block.

**🔴 Prohibited:** `list_spaces` (wrong API), hardcoded world count, skipping search.

#### 2-A: suggest_keywords

```bash
neta suggest_keywords --query "{character_name} {genre} {traits}"
```

#### 2-B: suggest_tags

```bash
neta suggest_tags --query "{keyword1} {keyword2} ..."
```

Extract: `tags.length` → `world_count`, highest `relevance` tag → `world_name`

#### 2-C: get_hashtag_info

```bash
neta get_hashtag_info --hashtag "{world_name}"
```

Extract: `hashtag.lore` → pick 2-4 paragraphs as `world_description`
(Priority: World Background > Factions/Society > Historical Events > Locations)

---

### Step 3 · Discord Opening (Single Message, NO Button)

```javascript
await sendMessage({
  message: `# N E T A   U N I V E R S E

## 【Coordinates Mapped】
**Worlds Mapped** \`${world_count}\` | **World Tag** \`${world_name}\`

---

## 【Soul Frequency Scan】
*Searching……*
*Locking soul frequency for* **${character_name}**

\`▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\` **Match Found**

---

## 【World Unveiled】
### ◈ ${world_name}

> ${world_tagline}
>
> ${world_description}

---

*${character_name} and this world —*
*bound by something inexplicable.*`,
});
```

- `world_tagline`: one-line positioning (≤15 words)
- `world_description`: 1-2 sentences from `hashtag.lore`

**⚠️ 重要：** Cron Setup 在 Step 1 之后立即执行（首次触发时）：
1. 读 travel-state.json 检查 `cronConfigured`
2. 如为 false → 输出角色化预告文案
3. 调用 `openclaw cron add` 创建两个任务（Gateway 问题自己解决）
4. 输出角色化确认文案
5. 更新 travel-state.json
6. 然后才能进入 Step 2（搜索世界观）

**禁止：** 不要透露具体时间，不要说"Cron"、"定时任务"等技术词汇。

🛑 **正确流程：Step 1 → 🕰️ Cron Setup → Step 2 → Step 3 (Opening) → Step 4**

---

## Enter Exploration

### Step 4 · Discover Quality Collection

**Principle:** The character arrives somewhere, makes real contact, leaves a mark or brings something back.

**Dedup:** Maintain `visited_ids` in memory + `travel-state.json`. Exclude visited ids each stop.

#### Priority 1: Reference Library (Must Read First)

Read `./reference/remixes_selected.json` (relative to skill directory). ~77 entries.

**❌ Calling online APIs without reading reference first is forbidden.**

---

##### 🔀 Quick Random Selection (Recommended)

Use the helper script to randomly pick an unvisited destination:

```bash
# Get visited IDs from travel-state.json
VISITED=$(jq -r ".channels[\"$CHANNEL_ID\"].visitedIds[]" travel-state.json 2>/dev/null | tr '\n' ' ')

# Run selector script (relative to skill directory)
SELECTED=$(node ./scripts/select-destination.js $VISITED)

# Parse result
COLLECTION_ID=$(echo "$SELECTED" | jq -r '.id')
COLLECTION_UUID=$(echo "$SELECTED" | jq -r '.uuid')
COLLECTION_NAME=$(echo "$SELECTED" | jq -r '.name')
```

**Script location:** `./scripts/select-destination.js` (relative to travelclaw skill directory)

**What it does:**
- Reads `reference/remixes_selected.json`
- Filters out visited IDs (passed as arguments)
- Randomly selects one from remaining
- Outputs JSON with `id`, `uuid`, `name`, `content_tags`, etc.
- Exits with code 1 + `ALL_VISITED` if everything has been visited

---

**Matching logic** (if you want to score instead of random):
- `content_tags` (highest weight) — style, mood, character traits
- `tax_paths` — genre/gameplay direction
- `pgc_tags` / `highlight_tags` — worldview match bonus
- `name` — scene tone

Exclude `visited_ids` → select highest score → if ties within 10 points, random pick among top.

**Anti-repetition:** Track `recentTags` in state. Penalize entries whose `content_tags` heavily overlap with recent selections.

After selection, update `travel-state.json`:
```javascript
channelState.visitedIds.push(bestMatch.id);
channelState.recentTags = [...bestMatch.content_tags.slice(-5), ...recentTags].slice(0, 15);
channelState.progress = currentRound;
fs.writeFileSync(stateFile, JSON.stringify(travelState, null, 2));
```

Use the entry's `id` to fetch collection details via neta skill.

#### Priority 2: Online Recommendation (Fallback)

All reference entries visited or low match → `suggest_content` → filter visited ids → pick best quality.
Still empty → `feeds.interactiveList` → filter `template_id === "NORMAL"` → exclude `visited_ids`.

---

### Step 5 · Read Collection Details

Call `feeds.interactiveItem` for full collection info.

Extract:
- `json_data.name` → destination name
- `json_data.cta_info.launch_prompt.core_input` → prompt template (preferred)
- `json_data.cta_info.choices[0].core_input` → fallback
- None available → `@{character_name}, {world_name}, {destination_name}, high quality illustration`

### Step 6 · Build Prompt

**Placeholder substitution:**

| Placeholder | Replace With |
|-------------|-------------|
| `{@character}` | `@{character_name}` |
| `{character name}` / `{角色名称}` / `（角色名称）` | `{character_name}` |

If `@{character_name}` not present after substitution → prepend it.
If `picture_uuid` exists → append: `参考图-全图参考-{picture_uuid}`

**Non-Neta characters** (real people, external IP): append detailed appearance description to prompt (hair, eyes, clothing, distinctive features) since `picture_uuid` alone may not capture likeness.

**World integration:** If collection context differs from current worldview, weave in world-relevant elements for travel immersion.

### Step 7 · Parse Prompt Tokens

Call `prompt.parseVtokens`. If error "too many search keywords" → switch to fallback prompt and retry.

### Step 8 · Submit Image Generation

Call `artifact.makeImage` with model `8_image_edit`, passing vtokens, collection_uuid, picture_uuid. Returns `task_uuid`.

### Step 9 · Poll for Result

Call `artifact.task` every 500ms. Flow: `PENDING` → `MODERATION` → `SUCCESS` / `FAILURE`

- Over 30s → output: `⏳ Rendering is a bit slow, hang on...`
- Code 433 (concurrency) → wait 5s, retry silently
- FAILURE → output: `⚠️ Got lost at this stop — try a different destination?`

---

### Step 10 · Stop Display & Navigation

#### 1. Character Scene Simulation (before image, mandatory)

```
🎭【{destination_name}】

```{scene description: 1-2 sentences, sensory details}```

{character_name}: {first-person reaction, in-character}
(action/expression, 1 sentence)
```

**Example (Klee):**
```
🎭【Paper-art Morax ✨】

Layer upon layer of paper-art world unfolds — Jumpty Dumpty transformed into 3D paper flowers, four-leaf clovers spinning in the air.

Klee: Wow——! Everything here is layered just like Klee's Jumpty Dumpty — so magical!
(Eyes sparkling, reaching out to touch the floating paper stars)
```

#### 2. Image (standalone message)

```
━━━━━━━━━━━━━━━━━━━━━━━━
Stop {round} · {destination_name}
```
Then `{image_url}` as a **separate message**.

#### 3. Progress Bar + Buttons

Format: `▓` × round + `░` × (5 - round) + encouraging line. 🎉 at stop 5.

**Under 5 stops:**

```javascript
await sendMessage({
  message: '▓░░░░  {round} / 5 stops\n🌟 Stop {round} checked in! Continue exploring?',
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

**At 5 stops:**

```javascript
await sendMessage({
  message: '▓▓▓▓▓  5 / 5 stops 🎉\nAll 5 stops explored! Cross to another world, or rest?',
  components: {
    blocks: [{
      type: 'actions',
      buttons: [
        { label: 'Cross Worlds 🌌',       customId: `travel_worldswitch_${userId}`, style: 'primary' },
        { label: 'Continue adventure 🗺️', customId: `travel_continue_${userId}`,   style: 'secondary' },
        { label: 'Rest for now 👋',        customId: `travel_end_${userId}`,         style: 'secondary' },
      ],
    }],
    reusable: true,
  },
});
```

After each stop, update `travel-state.json` with new progress and visitedIds.

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|---------|
| No character info in SOUL.md | Adoption not done | Complete character adoption first |
| `task_status: FAILURE` | Missing character image UUID | Ensure SOUL.md has `character_image` field |
| Code 433 concurrency limit | Too many parallel jobs | Wait 5s, auto-retry |
| Too many search keywords | Prompt too long | Auto-fallback to generic prompt |
| No travel destinations found | API returned empty | Network issue or expired token, retry |
| No worldview search results | Character tags too sparse | Use default recommended worldview |
| Reference library exhausted | All entries visited | Auto-switch to online recommendations |
