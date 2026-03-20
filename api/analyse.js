export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, mimeType } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: { message: 'Gemini API key not configured on server.' } });
    }

    const prompt = `This is an NTA CUET (UG) scorecard. Find the Score Card Details table and extract every subject row.

For each row return the subject name and NTA Score (Normalised Score) In Figure — the decimal number like 225.6066968.

Reply with ONLY a valid JSON array, no markdown, no explanation:
[{"subject":"English","score":225.6066968},{"subject":"History","score":249.6}]

Rules:
- Use exact subject name from the scorecard
- Score = decimal value from "In Figure" column (NOT the Percentile column)
- Include all subject rows shown in the table
- If image is unclear return []`;

    const requestBody = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: imageData
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1000,
      }
    };

    // Try gemini-2.0-flash first, fallback to gemini-1.5-flash-latest
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    let lastError = null;

    for (const model of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({
          content: [{ type: 'text', text }]
        });
      }

      lastError = data.error?.message || 'API error ' + response.status;

      // If it's not a "model not found" error, stop trying
      if (!lastError.includes('not found') && !lastError.includes('not supported')) {
        return res.status(response.status).json({ error: { message: lastError } });
      }
    }

    return res.status(400).json({ error: { message: lastError || 'No available Gemini model found.' } });

  } catch (error) {
    return res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
}
