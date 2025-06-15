import { NLUOutput } from "../types/agents";
import { nluAgent } from "./NLU";
import { sttAgent } from "./STT";

type InputType = string | Blob; // Blob for audio, string for text

export const inputHandler = async (input: InputType): Promise<NLUOutput> => {
  if (typeof input === "string") {
    // Text input - process directly with NLU
    return await nluAgent(input);
  } else {
    // Audio input - convert to text first
    const sttResult = await sttAgent(input);
    return await nluAgent(sttResult.text);
  }
};
