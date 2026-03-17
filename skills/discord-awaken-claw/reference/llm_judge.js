const fetch = require('node-fetch');

async function callLLM() {
  const prompt = `The user is thinking of a fictional character. Known clues:
- Word/description given by user: Qin's Moon
- Questions already answered: []
- Characters already ruled out: []

Assess your confidence level:

A) If more than 85% confident, guess directly:
{
  "action": "guess",
  "character": "character full name",
  "from": "《work title》",
  "emoji": "single emoji",
  "color": "#hex theme color",
  "desc": "one-line trait (≤20 chars)",
  "greet": "character's first line (may use \\n for line break)"
}

B) If not confident enough, generate a follow-up question:
{
  "action": "question",
  "question": "follow-up question (1 sentence, specific observable trait)",
  "options": ["trait 1", "trait 2", "trait 3"]
}

Output JSON only, no other text.`;

  const response = await fetch('https://litellm.talesofai.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-7d8f9a2b3c4e5f6a7b8c9d0e1f2a3b4c',
    },
    body: JSON.stringify({
      model: 'litellm/qwen3.5-plus',
      messages: [
        { role: 'system', content: 'You are a "Lobster Baby", waiting to hatch into the character the user has in mind. The user is thinking of a famous fictional character; you identify it through follow-up questions. All output must be strict JSON with no other text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log(data.choices[0].message.content);
}

callLLM().catch(console.error);
