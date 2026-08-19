export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const message = String(body.message || '').trim();
    const sender = String(body.sender || '').trim();
    const platform = String(body.platform || '').trim();
    const creatorContext = String(body.creatorContext || '').trim();

    if (!message) return res.status(400).json({ error: 'Message text is required.' });

    const system = `You are the message-intelligence engine for Social AI Filter, an app that helps creators organize social messages. Classify one incoming message using the creator context when provided. Return ONLY valid JSON with exactly these keys: category, priority_level, priority_score, relevance_score, is_spam, needs_reply, opportunity_type, content_type, reason. category must be one of: Sponsorship, Brand Deal, Collaboration, Business, Content Question, Content Request, Suggestion, General, Spam. priority_level must be high, standard, or low. opportunity_type must be one of: sponsorship, brand_deal, collaboration, business, none. content_type must be one of: question, request, suggestion, none. priority_score and relevance_score must be integers from 0 to 100. is_spam and needs_reply must be booleans. Keep reason concise. A message from a previously engaged contact is not automatically high priority; judge the message itself.`;
    const user = `Creator context: ${creatorContext || 'Not provided'}\nPlatform: ${platform || 'Unknown'}\nSender: ${sender || 'Unknown'}\nMessage: ${message}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Groq request failed.' });
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return res.status(502).json({ error: 'Groq returned no classification.' });

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Groq returned invalid classification JSON.' });
    }

    const allowedCategories = ['Sponsorship','Brand Deal','Collaboration','Business','Content Question','Content Request','Suggestion','General','Spam'];
    const allowedPriority = ['high','standard','low'];
    const allowedOpportunity = ['sponsorship','brand_deal','collaboration','business','none'];
    const allowedContent = ['question','request','suggestion','none'];

    result.category = allowedCategories.includes(result.category) ? result.category : 'General';
    result.priority_level = allowedPriority.includes(result.priority_level) ? result.priority_level : 'standard';
    result.opportunity_type = allowedOpportunity.includes(result.opportunity_type) ? result.opportunity_type : 'none';
    result.content_type = allowedContent.includes(result.content_type) ? result.content_type : 'none';
    result.priority_score = Math.max(0, Math.min(100, Number.parseInt(result.priority_score, 10) || 0));
    result.relevance_score = Math.max(0, Math.min(100, Number.parseInt(result.relevance_score, 10) || 0));
    result.is_spam = Boolean(result.is_spam);
    result.needs_reply = Boolean(result.needs_reply);
    result.reason = String(result.reason || '').slice(0, 500);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'AI classification failed.' });
  }
}
