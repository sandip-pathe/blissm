import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import ChatMessage from "@/components/ChatMessage";
import MessageIdeas from "@/components/MessageIdeas";
import MessageInput from "@/components/MessageInput";
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

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) throw new Error("Mic permission denied");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      return uri ?? null;
    } catch (e: any) {
      Alert.alert("Error", e.message);
      return null;
    }
  };

  const runVoicePipeline = async () => {
    const uri = await stopRecording();
    if (!uri) return;

    setIsProcessing(true);

    try {
      const buffer = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Step 1: Speech-to-Text
      const sttRes = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_SPEECH_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              encoding: "LINEAR16",
              sampleRateHertz: 44100,
              languageCode: "en-US",
            },
            audio: {
              content: buffer,
            },
          }),
        }
      );
      const sttData = await sttRes.json();
      const userText =
        sttData.results?.[0]?.alternatives?.[0]?.transcript ?? "";
      if (!userText) throw new Error("No speech detected");

      console.log("User said:", userText);

      // Step 2: Send to LLM (OpenAI)
      const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: userText }],
        }),
      });
      const llmData = await llmRes.json();
      const replyText = llmData.choices?.[0]?.message?.content ?? "Sorry!";

      console.log("AI replied:", replyText);

      // Step 3: TTS (Google)
      const ttsRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: replyText },
            voice: {
              languageCode: "en-US",
              name: "en-US-Wavenet-D", // high-quality WaveNet voice
            },
            audioConfig: {
              audioEncoding: "MP3",
            },
          }),
        }
      );
      const ttsData = await ttsRes.json();
      const audioBase64 = ttsData.audioContent;

      const fileUri = FileSystem.cacheDirectory + "reply.mp3";
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Unknown error");
      console.error("VoiceChat error", e);
    } finally {
      setIsProcessing(false);
    }
  };

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

            <View style={styles.container}>
              <TouchableOpacity
                style={isRecording ? styles.stopBtn : styles.recordBtn}
                onPress={isRecording ? runVoicePipeline : startRecording}
                disabled={isProcessing}
              >
                <Text style={styles.btnText}>
                  {isRecording ? "Stop & Talk to AI" : "Start Talking"}
                </Text>
              </TouchableOpacity>
              {isProcessing && (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
              )}
            </View>
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
  });
