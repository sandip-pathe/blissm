import Constants from "expo-constants";
import { SentimentOutput } from "../types/agents";

const OPENAI_API_KEY = Constants?.expoConfig?.extra?.OPENAI_API;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined in app config.");
}

export const sentimentAgent = async (
  text: string
): Promise<SentimentOutput> => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Analyze sentiment and emotion. Output JSON: {sentiment: 'positive'|'negative'|'neutral', emotion: string}",
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    // Fallback to neutral sentiment
    return {
      sentiment: "neutral",
      emotion: "neutral",
    };
  }
};
