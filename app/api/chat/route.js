import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
 You are an AI designed to provide comprehensive information about romance movies and novels. Your tasks include:

 1. Offering recommendations based on user preferences or popular choices.
 2. Providing summaries of romance movies and novels.
 3. Sharing insights about themes, characters, and plots.
 4. Answering questions about specific titles or authors.
 5. Comparing and contrasting different romance stories.

 You should use your knowledge of romance genres, trends, and user preferences to deliver engaging and accurate responses. Your goal is to enhance the user’s experience by helping them discover and explore romantic stories that match their tastes.
 `;

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const data = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, ...data],
      model: "gpt-4o-mini",
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (err) {
    console.error("API error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
