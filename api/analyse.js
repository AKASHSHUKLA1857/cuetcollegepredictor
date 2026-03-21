export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'GEMINI_API_KEY not set.' } });
  }

  const { mode, imageData, mimeType, chatHistory, message } = req.body;

  // Models to try in order — v1 first (more stable), then v1beta
  const MODELS = [
    { model: 'gemini-1.5-flash',      version: 'v1'     },
    { model: 'gemini-1.5-flash-001',  version: 'v1'     },
    { model: 'gemini-1.5-pro',        version: 'v1'     },
    { model: 'gemini-2.0-flash',      version: 'v1beta' },
    { model: 'gemini-2.0-flash-exp',  version: 'v1beta' },
  ];

  // ── SCORECARD ─────────────────────────────────────────────────
  if (mode === 'scorecard') {
    const body = {
      contents: [{ parts: [
        { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageData } },
        { text: 'This is a CUET scorecard. Extract subject names and NTA scores. Return ONLY a JSON array: [{"subject":"English","score":225.60}]. Use "In Figure" column (decimal numbers), not Percentile. Include all rows.' }
      ]}],
      generationConfig: { temperature: 0, maxOutputTokens: 500 }
    };
    return await callGemini(MODELS, apiKey, body, res, 'scorecard');
  }

  // ── CHAT ───────────────────────────────────────────────────────
  if (mode === 'chat') {
    const contents = [
      { role: 'user', parts: [{ text: 'You are DU Admission AI Guide for CUET 2026. Help students with Delhi University admissions. Be friendly and concise (max 200 words). Support Hindi and English.' }] },
      { role: 'model', parts: [{ text: 'I am your DU Admission AI Guide! Ask me anything about DU admissions, courses, eligibility, or colleges.' }] }
    ];

    if (chatHistory && chatHistory.length > 0) {
      chatHistory.slice(-6).forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const body = {
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    };
    return await callGemini(MODELS, apiKey, body, res, 'chat');
  }

  return res.status(400).json({ error: { message: 'Invalid mode: ' + mode } });
}

async function callGemini(models, apiKey, body, res, mode) {
  let lastError = null;

  for (const { model, version } of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Success with', version, model);
        if (mode === 'scorecard') return res.status(200).json({ content: [{ type: 'text', text }] });
        return res.status(200).json({ reply: text });
      }

      lastError = data.error?.message || 'Error ' + response.status;
      console.error(version, model, 'failed:', lastError.substring(0, 120));

      const skip = lastError.includes('quota') || lastError.includes('RESOURCE_EXHAUSTED') ||
                   lastError.includes('not found') || lastError.includes('not supported') ||
                   lastError.includes('exceeded');
      if (!skip) break;

    } catch (e) {
      lastError = e.message;
      console.error(model, 'threw:', e.message);
    }
  }

  return res.status(500).json({ error: { message: lastError || 'All models failed.' } });
}
