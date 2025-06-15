import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { AudioModule, createAudioPlayer } from "expo-audio";
import Constants from "expo-constants";

const GOOGLE_CLOUD_API_KEY = Constants?.expoConfig?.extra?.GOOGLE_CLOUD_API_KEY;

export async function getBase64FromUri(uri: string) {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    console.error("File read error", error);
    return null;
  }
}

export async function stopAndGetBase64(
  recorder: AudioRecorderInstance | null
): Promise<string | null> {
  if (!recorder) {
    console.warn("[stopAndGetBase64] No recorder provided");
    return null;
  }
  try {
    console.log("[stopAndGetBase64] Stopping recorder...");
    await recorder.stop();
    console.log("[stopAndGetBase64] Recorder stopped");

    const uri = recorder.uri;
    console.log("[stopAndGetBase64] Recording URI:", uri);
    if (!uri) throw new Error("Recorder URI is null");

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("[stopAndGetBase64] Base64 length:", base64.length);
    return base64;
  } catch (error) {
    console.error("[stopAndGetBase64] Error:", error);
    return null;
  }
}

export async function checkRecordingPermissions() {
  const status = await AudioModule.getRecordingPermissionsAsync();
  return status.granted;
}

export async function requestRecordingPermissions() {
  const status = await AudioModule.requestRecordingPermissionsAsync();
  if (!status.granted) {
    console.warn("Microphone permission denied");
  }
  return status.granted;
}

export async function speechToText(base64Audio: string) {
  if (!GOOGLE_CLOUD_API_KEY) return null;

  const encoding = Platform.OS === "android" ? "AMR_WB" : "LINEAR16";

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

export async function createAudioPlayerFromBase64(base64Data: string) {
  try {
    const uri = `${FileSystem.cacheDirectory}temp_audio.mp3`;
    await FileSystem.writeAsStringAsync(uri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return createAudioPlayer({ uri });
  } catch (error) {
    console.error("Audio player creation error", error);
    return null;
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>(
    (_, reject) =>
      (timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  );
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timer!);
  return result as T;
}

export async function stopRecording(
  recorder: AudioRecorderInstance | null
): Promise<string | null> {
  if (!recorder) {
    console.warn("[stopRecording] No recorder provided");
    return null;
  }
  try {
    console.log("[stopRecording] Stopping...");
    await recorder.stop();
    console.log("[stopRecording] Stopped. URI:", recorder.uri);
    return recorder.uri;
  } catch (error) {
    console.error("[stopRecording] Error:", error);
    return null;
  }
}
