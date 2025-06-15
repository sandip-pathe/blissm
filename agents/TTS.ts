import Constants from "expo-constants";

const GEMINI_API_KEY = Constants?.expoConfig?.extra?.GEMINI_API;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY error from TTS.");
}

export const ttsAgent = async (
  text: string,
  languageCode: string
): Promise<{ audioContent: string | null; fallback: boolean }> => {
  try {
    console.log("gemini Api Key", GEMINI_API_KEY);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: JSON.stringify({
                    textInput: { text },
                    audioConfig: {
                      audioEncoding: "MP3",
                      languageCode,
                      speakingRate: 1.0,
                      pitch: 0,
                    },
                  }),
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    return {
      audioContent: data.candidates?.[0]?.content?.parts?.[0]?.text || null,
      fallback: !data.candidates?.[0]?.content?.parts?.[0]?.text,
    };
  } catch (error) {
    return { audioContent: null, fallback: true };
  }
};
