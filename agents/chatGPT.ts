import Constants from "expo-constants";
import {
  NLUOutput,
  SentimentOutput,
  ContextDoc,
  UserProfile,
} from "../types/agents";

const OPENAI_API_KEY = Constants?.expoConfig?.extra?.OPENAI_API;

type ChatGPTResponse = {
  responseText: string;
  action?: string;
};

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined in app config.");
}

export const chatGptAgent = async (
  nluOutput: NLUOutput,
  sentiment: SentimentOutput,
  contextDocs: ContextDoc[],
  profile: UserProfile,
  conversationHistory: string[]
): Promise<ChatGPTResponse> => {
  try {
    const contextString = contextDocs.map((doc) => doc.content).join("\n");
    const historyString = conversationHistory.slice(-5).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. Respond in ${profile.preferences.language}.
                    Context: ${contextString}
                    Conversation History: ${historyString}
                    User sentiment: ${sentiment.sentiment} (${sentiment.emotion})`,
          },
          {
            role: "user",
            content: nluOutput.rawText,
          },
        ],
      }),
    });

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    // Check if response contains action trigger
    const action = responseText.includes("BOOK_APPOINTMENT")
      ? "book_appointment"
      : undefined;

    return { responseText, action };
  } catch (error) {
    return {
      responseText:
        "I'm having trouble responding right now. Please try again later.",
    };
  }
};
