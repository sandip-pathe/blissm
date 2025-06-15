import { getProfile } from "./memoryProfile";
import { ttsAgent } from "./TTS";

export const responseGenerator = async (
  responseText: string,
  userId: string
): Promise<{
  textResponse: string;
  audioContent: string | null;
  fallback: boolean;
}> => {
  const profile = await getProfile(userId);

  if (profile.preferences.ttsEnabled) {
    try {
      const ttsResult = await ttsAgent(
        responseText,
        profile.preferences.language
      );
      return {
        textResponse: responseText,
        audioContent: ttsResult.audioContent,
        fallback: ttsResult.fallback,
      };
    } catch (error) {
      console.error("TTS failed:", error);
    }
  }

  // Return text-only response if TTS is disabled or failed
  return {
    textResponse: responseText,
    audioContent: null,
    fallback: true,
  };
};
