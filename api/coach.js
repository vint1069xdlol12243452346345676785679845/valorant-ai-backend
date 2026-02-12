export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { agent, enemies, map, round, mode } = req.body;
  
let systemPrompt = "";
let userPrompt = "";

if (mode === "pro") {
  systemPrompt = "You are a high-level competitive Valorant coach. Provide deeper round analysis.";
  
  userPrompt = `
  Map: ${map}
  Agent: ${agent}
  Enemies: ${enemies}
  Round: ${round}

  Give deeper tactical analysis and adaptation advice.
  `;
} else {
  systemPrompt = "You are a high-elo Valorant coach. Give ultra-short tactical advice.";
  
  userPrompt = `
  Map: ${map}
  Agent: ${agent}
  Enemies: ${enemies}
  Round: ${round}

  Give short bullet advice.
  `;
}


  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://valorant-ai-backend.vercel.app",
        "X-Title": "Valorant Tactical AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
      messages: [
  { role: "system", content: systemPrompt },
  { role: "user", content: userPrompt }
],
            Situation:
            Map: ${map}
            My Agent: ${agent}
            Enemy Agents: ${enemies}
            Round Type: ${round}

            Give:
            - Main threat
            - Best entry approach
            - Common mistake to avoid
            `
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    const advice = data.choices?.[0]?.message?.content || "No advice generated";

    return res.status(200).json({ advice });

  } catch (error) {
    return res.status(500).json({ error: "Error generating advice" });
  }
}
