import Constants from "expo-constants";
import { NLUOutput } from "../types/agents";

const API_URL = "https://api.openai.com/v1/chat/completions";

const OPENAI_API_KEY = Constants?.expoConfig?.extra?.OPENAI_API;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined in app config.");
}

export const nluAgent = async (text: string): Promise<NLUOutput> => {
  try {
    // Simple regex fallback
    if (/hello|hi|hey/i.test(text))
      return {
        languageCode: "en-US",
        intent: "greeting",
        entities: {},
        rawText: text,
      };

    // Use OpenAI for complex parsing
    const response = await fetch(API_URL, {
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
            content: `Parse user input: Detect language (BCP-47), intent, and entities. Output JSON: {languageCode: string, intent: string, entities: {[key:string]:string}}`,
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
    return {
      ...JSON.parse(data.choices[0].message.content),
      rawText: text,
    };
  } catch (error) {
    // Fallback response
    return {
      languageCode: "en-US",
      intent: "unknown",
      entities: {},
      rawText: text,
    };
  }
};
