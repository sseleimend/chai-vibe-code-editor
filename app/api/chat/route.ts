import { NextResponse } from "next/server";
import { Ollama } from "ollama";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  history: ChatMessage[];
}

async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  const systemPrompt = ``;

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  // const prompt = fullMessages
  //   .map((msg) => `${msg.role}: ${msg.content}`)
  //   .join("\n\n");

  try {
    const ollama = new Ollama({
      host: "https://ollama.com",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
    });

    const response = await ollama.chat({
      model: "gpt-oss:20b-cloud",
      messages: fullMessages,
      options: { temperature: 0.7, top_p: 0.9 },
      stream: false,
    });

    if (!response?.message?.content) {
      throw new Error(`LLM API error`);
    }

    const suggestion = response.message.content;

    return suggestion;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}

export async function POST(request: Request) {
  try {
    const { message, history = [] } = (await request.json()) as ChatRequestBody;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (msg) =>
            msg &&
            typeof msg === "object" &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role)
        )
      : [];

    const recentHistory = validHistory.slice(-10);

    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    const aiResponse = await generateAIResponse(messages);

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process the request",
        details: (error as Error).message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
