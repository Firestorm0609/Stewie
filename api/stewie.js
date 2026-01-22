export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405 }
      );
    }

    // Parse body safely
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400 }
      );
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages required' }),
        { status: 400 }
      );
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing GROQ_API_KEY' }),
        { status: 500 }
      );
    }

    // Call Groq
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages,
          temperature: 0.9,
          max_tokens: 100,
        }),
      }
    );

    const data = await groqResponse.json();

    // 🔒 HARD GUARD — prevents your crash
    if (
      !data ||
      !data.choices ||
      !Array.isArray(data.choices) ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error('Groq invalid response:', data);

      return new Response(
        JSON.stringify({
          response:
            "What the deuce? The infernal AI has embarrassed itself. Try again, imbecile."
        }),
        { status: 200 }
      );
    }

    const stewieResponse = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ response: stewieResponse }),
      { status: 200 }
    );

  } catch (err) {
    console.error('Server error:', err);

    return new Response(
      JSON.stringify({
        response:
          "Good lord… everything is broken. Typical."
      }),
      { status: 200 }
    );
  }
}
