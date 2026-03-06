import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentName, grades, sgpa, cgpa, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const gradesText = typeof grades === "string"
      ? grades
      : (grades || []).map((g: any) => `${g.course}: ${g.grade} (${g.credits} credits)`).join("\n");

    let prompt: string;
    let systemPrompt: string;

    if (mode === "roast-telugu") {
      systemPrompt = "You are a hilarious Telugu comedian who roasts students' grades. You write in Telugu but using English letters (Tenglish/Manglish). You are savage, funny, and use popular Telugu expressions, movie references, and Gen-Z Telugu slang. Always use emojis generously.";
      prompt = `Roast this student's grades in Telugu written in English letters (Tenglish). Be SAVAGE but HILARIOUS. Use Telugu movie dialogues, popular Telugu expressions like "Enti ra", "Emanna", "Brathuku", "Amma", etc. Mix Telugu and English naturally like how Telugu students actually talk.

Student SGPA: ${sgpa || "N/A"}
Grades: ${gradesText || "No data"}

Write a 3-4 sentence absolutely SAVAGE Telugu roast in English letters. Include:
- Telugu movie references or dialogues twisted for grades (like Baahubali, Pushpa, RRR, Ala Vaikunthapurramloo, etc.)
- Common Telugu parent reactions ("Mee nanna chuste...", "Relatives ki em cheppali...")
- Telugu college student slang
- Lots of emojis

Example style: "Enti ra nee SGPA chusi calculator kuda shock ayyindi! 😱 Mee nanna chuste 'Naaku pillalu levu' antadu! 💀"

IMPORTANT: Write ONLY in Telugu using English letters. Do NOT use Telugu script. Keep it fun and relatable for Telugu engineering students.`;
    } else if (mode === "roast") {
      systemPrompt = "You are a savage but funny comedian roasting a student's grades. Be brutal but hilarious.";
      prompt = `You are a savage but funny comedian roasting a student's grades. Be brutal but hilarious. Use Gen-Z slang and emojis.

Student SGPA: ${sgpa || "N/A"}
Grades: ${gradesText || "No data"}

Write a 2-3 sentence absolutely savage roast of their grades. Be creative and funny. Don't be mean about the person, just their grades.`;
    } else {
      systemPrompt = "You are an academic advisor providing student feedback.";
      prompt = `You are an academic advisor. Generate a brief, encouraging performance feedback for a student.

Student: ${studentName}
SGPA: ${sgpa || "N/A"}
CGPA: ${cgpa || "N/A"}
Grades:
${gradesText || "No grade data available."}

Write 3-4 sentences of constructive feedback highlighting strengths and areas for improvement. Be specific about subjects. Keep it professional and encouraging.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Unable to generate feedback.";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
