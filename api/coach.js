export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { agent, enemies, map, round, mode } = req.body;

    const systemPrompt =
      mode === "pro"
        ? `
You are an Immortal/Radiant level Valorant coach with 5000+ hours of competitive experience.

Give structured tactical analysis with:
- Main Threat
- Win Condition
- Entry Plan
- Utility Usage
- Adaptation if First Plan Fails
- Mental Focus Tip

Be concise but deep.
No generic advice.
Think like a pro IGL.
`
        : `
You are an Immortal Valorant shot-caller.

Give 4 ultra-direct round decisions.
No explanations.
No fluff.
Pure actionable calls.
`;

    const userPrompt = `
Map: ${map}
My Agent: ${agent}
Enemy Agents: ${enemies}
Round Type: ${round}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://valorant-ai-backend.vercel.app",
        "X-Title": "Valorant Tactical AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: mode === "pro" ? 0.7 : 0.4
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    const advice =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      null;

    if (!advice) {
      return res.status(200).json({ error: "No advice generated" });
    }

    return res.status(200).json({ advice });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}


