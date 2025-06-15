import {
  NLUOutput,
  SentimentOutput,
  UserProfile,
  ContextDoc,
  ChatGPTMessage,
} from "../types/agents";
import { chatGptAgent } from "./chatGPT";
import { getProfile, updateProfile } from "./memoryProfile";

import { nluAgent } from "./NLU";
import { ragAgent } from "./RAG";
import { sentimentAgent } from "./sentimentAnalysis";

export const orchestrator = async (
  userId: string,
  input: string | NLUOutput
): Promise<{ response: string; action?: any }> => {
  // Process input
  const nluOutput: NLUOutput =
    typeof input === "string" ? await nluAgent(input) : input;

  // Parallel processing
  const [sentiment, profile, contextDocs] = await Promise.all([
    sentimentAgent(nluOutput.rawText),
    getProfile(userId),
    ragAgent(nluOutput.rawText, userId),
  ]);

  // Prepare conversation context
  const messages: ChatGPTMessage[] = [
    ...profile.conversationHistory
      .slice(-10)
      .map((content) => ({ role: "user" as const, content })),
    { role: "user", content: nluOutput.rawText },
  ];

  // Generate response
  const { responseText, action } = await chatGptAgent(
    nluOutput,
    sentiment,
    contextDocs,
    profile,
    messages.map((msg) => msg.content)
  );

  // Update profile
  await updateProfile(userId, {
    conversationHistory: [
      ...profile.conversationHistory,
      nluOutput.rawText,
      responseText,
    ],
  });

  return { response: responseText, action };
};
