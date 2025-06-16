import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Define AudioRecorderInstance type if not imported from a library
export interface AudioRecorderInstance {
  stop: () => Promise<void>;
  uri?: string | null;
}

const GOOGLE_CLOUD_API_KEY = Constants?.expoConfig?.extra?.GOOGLE_CLOUD_API_KEY;

export async function speechToText(base64Audio: string) {
  if (!GOOGLE_CLOUD_API_KEY) return null;

  const encoding = Platform.OS === "android" ? "AMR_WB" : "LINEAR16";
  console.log(
    `[speechToText] Using encoding: ${encoding}, base64 length: ${base64Audio.length}`
  );
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_CLOUD_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio: { content: base64Audio },
        config: {
          encoding,
          sampleRateHertz: 16000,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
        },
      }),
    }
  );

  const data = await response.json();
  console.log("[speechToText] Response data:", data);
  if (!data || !data.results || data.results.length === 0) {
    console.warn("[speechToText] No results found");
    return "";
  }
  return data.results?.[0]?.alternatives?.[0]?.transcript || "";
}

export async function textToSpeech(text: string) {
  if (!GOOGLE_CLOUD_API_KEY || !text) return null;

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-US", name: "en-US-Neural2-J" },
        audioConfig: { audioEncoding: "MP3" },
      }),
    }
  );

  const data = await response.json();
  return data.audioContent;
}
