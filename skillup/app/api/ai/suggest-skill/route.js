import { anthropic, MODEL } from "../../../../lib/anthropic";

export async function POST(req) {
  try {
    const { skills } = await req.json();

    const skillList =
      skills && skills.length
        ? skills.map((s) => `- ${s.title}: ${s.description || ""}`).join("\n")
        : "(user ne abhi tak koi skill add nahi ki)";

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Tum ek career mentor ho jo engineering students ko guide karte ho.
User ki current skills:
${skillList}

In skills ko dekh kar, unhe batao:
1. Ab unhe kis nayi skill ya topic pe focus karna chahiye (specific rakho, generic advice mat do)
2. Kyun (1-2 lines)
3. Ek chhota action step jo woh is week kar sakte hain

Hinglish me casual tone me jawab do, 4-5 lines se zyada nahi.`,
        },
      ],
    });

    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
    return Response.json({ suggestion: text });
  } catch (err) {
    console.error(err);
    return Response.json({ suggestion: "Error: AI se response nahi mil paya." }, { status: 500 });
  }
}
