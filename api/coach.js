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
        ? "You are an Immortal/Radiant Valorant coach. Provide deep structured tactical analysis."
        : "You are an Immortal Valorant coach. Give ultra-short round-ready tactical advice. Max 4 bullet points. No explanations.";

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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await response.json();

    console.log("OPENROUTER RESPONSE:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    const advice =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : null;

    if (!advice) {
      return res.status(200).json({
        error: "No advice generated",
        fullResponse: data
      });
    }

    return res.status(200).json({ advice });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

