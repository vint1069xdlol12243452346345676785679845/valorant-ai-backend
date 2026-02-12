export default async function handler(req, res) {
  // 👇 CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { agent, enemies, map, round } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional Valorant tactical coach. Give short, tactical, round-based advice. Be concise and structured."
          },
          {
            role: "user",
            content: `
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
