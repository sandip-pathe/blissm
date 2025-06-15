// Agent input/output types
export type STTOutput = { text: string; confidence: number };
export type NLUOutput = {
  languageCode: string;
  intent: string;
  entities: Record<string, string>;
  rawText: string;
};
export type SentimentOutput = {
  sentiment: "positive" | "negative" | "neutral";
  emotion: string;
};
export type UserProfile = {
  userId: string;
  name: string;
  preferences: {
    ttsEnabled: boolean;
    language: string;
  };
  conversationHistory: string[];
};
export type ContextDoc = { content: string; source: string };
export type ChatGPTMessage = { role: "user" | "assistant"; content: string };
