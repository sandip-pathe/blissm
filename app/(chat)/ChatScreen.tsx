import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import ChatMessage from "@/components/ChatMessage";
import MessageIdeas from "@/components/MessageIdeas";
import { defaultStyles } from "@/constants/Styles";
import { useSQLiteContext } from "expo-sqlite";
import {
  addChat,
  getChatById,
  getLastTwoExchanges,
} from "../../database/sqlite";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "../../constants/firebaseConf";
import BouncingDotsLoader from "@/components/BouncingDotsLoader";
import DisclaimerModal from "@/app/(modals)/Desclaimer";
import { posthog } from "@/constants/posthogConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchGlobalInstructions,
  fetchSummaryInstructions,
  storeChatInFirestore,
} from "./chatHelper";
import { useCustomAuth } from "@/components/authContext";
import { useTheme } from "@react-navigation/native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

export enum Role {
  User = 0,
  Bot = 1,
}

export interface Message {
  role: Role;
  content: string;
}

export interface Chat {
  id: number;
  title: string;
}

const DEFAULT_SETTINGS = {
  messagesLimit: 50,
  hideOlderChats: false,
  fontSize: 16,
};

const API_URL = "https://api.openai.com/v1/chat/completions";

const GOOGLE_SPEECH_API_KEY =
  Constants?.expoConfig?.extra?.GOOGLE_SPEECH_API_KEY;
const GOOGLE_TTS_API_KEY = Constants?.expoConfig?.extra?.GOOGLE_TTS_API_KEY;

if (!GOOGLE_SPEECH_API_KEY) {
  throw new Error("GOOGLE_SPEECH_API_KEY is not defined in ChatScreen.");
}
if (!GOOGLE_TTS_API_KEY) {
  throw new Error("GOOGLE_TTS_API_KEY is not defined in ChatScreen.");
}

const OPENAI_API = Constants?.expoConfig?.extra?.OPENAI_API;
const GCP_Project_API = Constants?.expoConfig?.extra?.GCP_Project_API;

if (!OPENAI_API) {
  throw new Error("OPENAI_API_KEY is not error in ChatScreen.");
}

if (!GCP_Project_API) {
  throw new Error("GCP_Project_API is not defined in ChatScreen.");
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: ".awb",
    outputFormat: Audio.AndroidOutputFormat.AMR_WB,
    audioEncoder: Audio.AndroidAudioEncoder.AMR_WB,
    sampleRate: 16000,
    numberOfChannels: 1,
  },
  ios: {
    // Keep iOS as WAV/LINEAR16 as it's the most reliable there
    extension: ".wav",
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

const ChatPage = () => {
  const { currentUser } = useCustomAuth();
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [chatId, setChatId] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const db = useSQLiteContext();
  const [loadingInitialization, setLoadingInitialization] = useState(false);
  const [summaryContext, setSummaryContext] = useState("");
  const { id: personaId } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("Blissm");
  const listRef = useRef<FlatList<Message>>(null);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState("");
  const [summaryInstructions, setSummaryInstructions] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    messagesLimit: 50,
    hideOlderChats: false,
    fontSize: 16,
  });
  const router = useRouter();
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "listening" | "processing" | "speaking" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  // Refs for audio management
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastUpdateTimeRef = useRef<number>(0);

  const toggleDisclaimer = () => setDisclaimerVisible((prev) => !prev);

  const renderItem = useCallback(
    ({ item }) => <ChatMessage fontSize={16} {...item} />,
    []
  );

  useEffect(() => {
    setLoadingInitialization(true);
    AsyncStorage.getItem("chatSettings")
      .then((data) => {
        if (data) {
          setSettings(JSON.parse(data));
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      })
      .catch(console.error);

    const initializeSession = async () => {
      if (!personaId) return;
      try {
        const existingSession = await db.getFirstAsync<{
          id: number;
          system_instructions: string;
          image_url: string;
        }>(
          `SELECT id, system_instructions, image_url FROM chatSessions WHERE persona_id = ?`,
          [personaId]
        );

        if (existingSession) {
          setChatId(existingSession.id);
          setSystemInstruction(existingSession.system_instructions);
          posthog.capture("session_resumed", { personaId });
        } else {
          const docRef = doc(FIRESTORE_DB, "blissmates", personaId);
          const globalInstructions = await fetchGlobalInstructions();
          const summaryInstructions = await fetchSummaryInstructions();
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) throw new Error("Persona not found, firebase");
          const personaData = docSnap.data();
          const systemInstructions = `${globalInstructions}\n${personaData.systemInstructions}`;
          const result = await db.runAsync(
            `INSERT INTO chatSessions (persona_id, system_instructions, summary_instructions, title, summary, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              personaId,
              systemInstructions,
              summaryInstructions,
              personaData.title,
              "",
              personaData.description,
              personaData.imageURL,
            ]
          );

          if (result.lastInsertRowId) {
            setChatId(result.lastInsertRowId);
            setSystemInstruction(systemInstructions);
            setSummaryInstructions(summaryInstructions);
            posthog.capture("session_initialized", { personaId });
          }
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      } finally {
        setLoadingInitialization(false);
      }
    };

    initializeSession();
  }, [personaId]);

  useFocusEffect(
    React.useCallback(() => {
      const onBlur = async () => {
        try {
          await db.runAsync(
            `UPDATE chatSessions SET summary = ? WHERE id = ?`,
            [summaryContext, chatId]
          );
        } catch (error) {
          console.error("Error during onBlur:", error);
        }
      };

      return () => {
        onBlur().catch((error) => {
          console.error("Error during onBlur in cleanup:", error);
        });
      };
    }, [chatId])
  );

  const loadMessages = async () => {
    if (!chatId) return;
    try {
      const chat = await getChatById(db, chatId, settings.messagesLimit);
      if (!chat) return;
      const transformedMessages = chat.messages.flatMap((msg) => [
        { role: Role.Bot, content: msg.bot_response },
        { role: Role.User, content: msg.user_prompt },
      ]);
      setTitle(chat.title);
      setMessages(transformedMessages);
      setSummaryContext(chat.summary);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  useEffect(() => {
    if (chatId) loadMessages();
  }, [chatId, settings.messagesLimit]);

  const fetchChatGPTCompletion = async (prompt: string) => {
    setLoading2(true);
    setLoading3(true);
    setMessages((prev) => [{ role: Role.User, content: prompt }, ...prev]);
    try {
      const history = await getLastTwoExchanges(db, chatId);

      const systemMessage = `
      ${systemInstruction}

      [Context]:
      ${summaryContext}
    `;
      console.log(`${systemInstruction}\n\nContext: ${summaryContext}`);
      const body = JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          ...history,
          { role: "user", content: prompt },
        ],
      });

      console.log("fetchChatGPTCompletion body:", body);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API}`,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API Error: ${response.status} - ${await response.text()}`
        );
      }

      const data = await response.json();
      const responseText =
        data.choices[0]?.message?.content || "No response available";

      console.log("fetchChatGPTCompletion response:", responseText);

      setLoading2(false);

      setMessages((prev) => [
        { role: Role.Bot, content: responseText },
        ...prev,
      ]);

      await addChat(db, chatId, prompt, responseText);
      const { newSummary, summaryTokenUsage } = await summarize(
        prompt,
        responseText,
        summaryContext
      );

      const tokenUsage = {
        total: data.usage?.total_tokens || 0,
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        system: systemMessage.length / 4 || 0,
      };

      await storeChatInFirestore(currentUser?.uid, personaId, {
        user: prompt,
        bot: responseText,
        summary: newSummary,
        tokenUsage,
        summaryTokenUsage,
        model: "gpt-4o",
        responseTimeMs: data.response_time || 0,
      });
    } catch (error) {
      console.error("Failed to fetch completion:", error);
    } finally {
      setLoading3(false);
    }
  };

  const summarize = async (
    prompt: string,
    response: string,
    oldSummary?: any
  ) => {
    try {
      const url = `https://api.openai.com/v1/chat/completions`;

      const body = JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: summaryInstructions },
          {
            role: "user",
            content: `Old Summary: ${
              oldSummary || "No Old Summary"
            }\n\nNew Exchange:\nUser: ${prompt}\nBot: ${response}`,
          },
        ],
        max_tokens: 500,
      });

      const responseData = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API}`,
        },
        body,
      });

      const data = await responseData.json();

      const newSummary = data.choices[0]?.message?.content || oldSummary;

      setSummaryContext(newSummary);
      console.log("New Summary:", newSummary);

      const summaryTokenUsage = {
        total: data.usage?.total_tokens || 0,
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        system: summaryInstructions.length / 4 || 0,
      };

      return { newSummary, summaryTokenUsage };
    } catch (error) {
      console.error("Failed to summarize:", error);
    }
  };

  // Audio recording and processing functions

  const startRecording = async () => {
    try {
      setVoiceStatus("listening");

      setStatusMessage("Listening... Speak now");

      setTranscript("");

      setPartialTranscript("");

      setAiResponse(""); // Request permissions

      const perm = await Audio.requestPermissionsAsync();

      if (!perm.granted) {
        throw new Error("Microphone permission not granted");
      } // Configure audio mode

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,

        playsInSilentModeIOS: true,

        staysActiveInBackground: true,
      }); // Start recording

      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS
      );

      recordingRef.current = recording;

      lastUpdateTimeRef.current = Date.now();
    } catch (error) {
      console.error("Recording start failed:", error);

      setVoiceStatus("error");

      setStatusMessage("Failed to start recording");
    }
  };

  const handleVoicePressIn = () => {
    startRecording();
  };

  const handleVoicePressOut = async () => {
    // Pass the recording object to the pipeline BEFORE it's unloaded.
    if (recordingRef.current) {
      const recordingToProcess = recordingRef.current;
      await stopRecording(); // This will set recordingRef.current to null
      runVoicePipeline(recordingToProcess); // Process the saved reference
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
    } catch (error) {
      console.error("Recording stop failed:", error);
      setVoiceStatus("error");
      setStatusMessage("Failed to stop recording");
    }
  };

  const runVoicePipeline = async (recording) => {
    try {
      setVoiceStatus("processing");
      setStatusMessage("Processing your request...");

      const uri = recording.getURI();
      if (!uri) {
        setVoiceStatus("idle");
        return;
      }
      console.log("1. RECORDING URI:", uri); // DEBUG 1

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("2. FILE INFO:", fileInfo); // DEBUG 2

      if (!fileInfo.exists || fileInfo.size < 1024) {
        // Keep this check
        throw new Error("Recording was too short.");
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(
        "3. BASE64 (First 100 Chars):",
        base64Audio.substring(0, 100)
      ); // DEBUG 3

      // Platform-specific config from Step 2
      const sttConfig =
        Platform.OS === "android"
          ? {
              // We are now sending exactly what we promised: AMR_WB
              encoding: "AMR_WB",
              sampleRateHertz: 16000, // This is required for AMR_WB
              languageCode: "en-US",
            }
          : {
              // iOS is sending LINEAR16 as promised
              encoding: "LINEAR16",
              sampleRateHertz: 16000,
              languageCode: "en-US",
            };

      // The rest of your fetch call and payload structure can remain the same.
      const sttPayload = {
        config: sttConfig,
        audio: {
          content: base64Audio,
        },
      };

      console.log(
        "4. GOOGLE STT PAYLOAD:",
        JSON.stringify(sttPayload.config, null, 2)
      ); // DEBUG 4

      // Send to STT
      setStatusMessage("Converting speech to text...");
      const sttResponse = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_SPEECH_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sttPayload),
        }
      );

      const sttData = await sttResponse.json();
      console.log(
        "5. FULL GOOGLE STT RESPONSE:",
        JSON.stringify(sttData, null, 2)
      ); // DEBUG 5

      // IMPORTANT: Check for an error object in the response
      if (sttData.error) {
        throw new Error(`Google API Error: ${sttData.error.message}`);
      }

      const transcript =
        sttData.results?.[0]?.alternatives?.[0]?.transcript || "";

      if (!transcript) {
        throw new Error("No speech detected by API");
      }

      setTranscript(transcript);
      setStatusMessage(`Processing: "${transcript}"`);

      // Send to AI
      setStatusMessage("Thinking about response...");
      const aiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "user", content: transcript }],
            stream: false, // --- CRITICAL CHANGE: Disable streaming ---
          }),
        }
      );

      // 3. Check for actual errors from the API
      if (!aiResponse.ok) {
        const errorBody = await aiResponse.text();
        console.error("OpenAI API Error Response:", errorBody);
        throw new Error(`AI request failed with status ${aiResponse.status}`);
      }

      // 4. Get the complete AI response in one go
      const aiData = await aiResponse.json();
      const aiText = aiData.choices[0]?.message?.content || "";

      console.log("7. FULL AI RESPONSE TEXT:", aiText);
      setAiResponse(aiText);

      if (!aiText.trim()) {
        throw new Error("AI returned an empty response.");
      }

      setStatusMessage("Generating speech...");
      const ttsResponse = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: aiText },
            voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );

      const ttsData = await ttsResponse.json();
      const audioBase64 = ttsData.audioContent;

      const fileUri = FileSystem.cacheDirectory + "response.mp3";
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Play audio
      setVoiceStatus("speaking");
      setStatusMessage("Speaking...");

      const { sound: playbackSound } = await Audio.Sound.createAsync({
        uri: fileUri,
      });
      soundRef.current = playbackSound;

      playbackSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setVoiceStatus("idle");
          setStatusMessage("");
        }
      });

      await playbackSound.playAsync();
    } catch (error) {
      console.error("Voice pipeline failed:", error);
      setVoiceStatus("error");
      // Provide a more user-friendly message
      setStatusMessage(error.message || "Processing failed");
      // Add a timeout to reset the button after an error
      setTimeout(() => {
        setVoiceStatus("idle");
        setStatusMessage("");
      }, 3000); // Reset after 3 seconds
    }
  };

  // Cleanup audio resources
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          statusBarBackgroundColor: colors.background,
          header: () => (
            <View style={styles.header}>
              <View style={styles.headerContainer}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.text}
                  onPress={() => {
                    router.back();
                  }}
                />
                <Text
                  style={styles.triggerText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              </View>
              <TouchableOpacity onPress={toggleDisclaimer}>
                <Ionicons
                  name="information-circle-outline"
                  size={30}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <DisclaimerModal
        visible={disclaimerVisible}
        onDismiss={() => setDisclaimerVisible(false)}
      />
      <View style={defaultStyles.pageContainer}>
        {loadingInitialization ? (
          <View style={styles.loadingContainer}>
            <BouncingDotsLoader />
          </View>
        ) : (
          <View style={styles.container}>
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.flashListContent}
              inverted
              keyboardDismissMode="interactive"
            />
            {loading2 && (
              <View style={styles.typingIndicatorContainer}>
                <BouncingDotsLoader />
              </View>
            )}
            {messages.length === 0 && (
              <MessageIdeas
                onSelectCard={fetchChatGPTCompletion}
                id={personaId}
              />
            )}
            {/* <View>
              <MessageInput
                isLoading={loading3}
                isRecording={isRecording}
                onShouldSend={fetchChatGPTCompletion}
                onRecordPress={isRecording ? handleStop : startRecording}
              />
            </View> */}

            <View style={styles.voiceStatusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text style={styles.statusText}>
                  {statusMessage || "Ready"}
                </Text>
              </View>

              {partialTranscript ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Heard:</Text>
                  <Text style={styles.transcriptText}>{partialTranscript}</Text>
                </View>
              ) : null}

              {transcript ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>You said:</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              ) : null}

              {aiResponse ? (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>AI Response:</Text>
                  <Text style={styles.responseText}>
                    {aiResponse.substring(0, 100)}
                    {aiResponse.length > 100 ? "..." : ""}
                  </Text>
                </View>
              ) : null}

              {voiceStatus === "processing" && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>

            {/* Voice control button */}
            <TouchableOpacity
              style={[
                styles.voiceButton,
                voiceStatus === "listening" && styles.listeningButton,
                voiceStatus === "processing" && styles.processingButton,
                voiceStatus === "speaking" && styles.speakingButton,
                voiceStatus === "error" && styles.errorButton,
              ]}
              onPressIn={handleVoicePressIn}
              onPressOut={handleVoicePressOut}
              disabled={
                voiceStatus === "processing" || voiceStatus === "speaking"
              }
            >
              {voiceStatus === "processing" ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {voiceStatus === "listening"
                    ? "Release to Process..."
                    : "Press and Hold to Speak"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
};

export default ChatPage;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 10,
    },
    header: {
      padding: 10,
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexDirection: "row",
      fontFamily: "Poppins-Regular",
    },
    typingIndicatorContainer: {
      marginHorizontal: 16,
      marginVertical: 10,
      alignItems: "flex-end",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderStartStartRadius: 0,
      maxWidth: "20%",
      padding: 10,
      borderRadius: 15,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      maxWidth: "90%",
    },
    triggerText: {
      fontSize: 16,
      flex: 1,
      color: colors.text,
      fontFamily: "Poppins-Bold",
      marginHorizontal: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    flashListContent: {
      paddingTop: 10,
      paddingBottom: 100,
    },
    recordBtn: {
      padding: 16,
      backgroundColor: "#26c6da",
      borderRadius: 12,
    },
    stopBtn: {
      padding: 16,
      backgroundColor: "#ef5350",
      borderRadius: 12,
    },
    btnText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "white",
    },
    voiceStatusContainer: {
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      margin: 16,
    },
    statusRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    statusLabel: {
      fontWeight: "bold",
      color: colors.text,
      width: 90,
    },
    statusText: {
      flex: 1,
      color: colors.text,
      fontStyle: "italic",
    },
    transcriptText: {
      flex: 1,
      color: colors.primary,
    },
    responseText: {
      flex: 1,
      color: colors.notification,
    },
    voiceButton: {
      padding: 16,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: "center",
      marginHorizontal: 40,
      marginVertical: 20,
      minHeight: 50,
      justifyContent: "center",
    },
    listeningButton: {
      backgroundColor: "#FF4136", // Red
    },
    processingButton: {
      backgroundColor: "#FF851B", // Orange
    },
    speakingButton: {
      backgroundColor: "#2ECC40", // Green
    },
    errorButton: {
      backgroundColor: "#FF4136", // Red
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
    },
    listeningIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    pulsingCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "white",
      marginRight: 10,
      opacity: 0.7,
    },
  });
