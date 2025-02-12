import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ImageBackground,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Stack, useLocalSearchParams } from "expo-router";
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
import Colors from "@/constants/Colors";
import {
  OPENAI_API,
  systemInstructions,
  summaryInstructions,
} from "@/constants/var";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "@/FirebaseConfig";
import BouncingDotsLoader from "@/components/BouncingDotsLoader";

export enum Role {
  User = 0,
  Bot = 1,
}

export interface Message {
  role: Role;
  content: string;
  imageUrl?: string;
  prompt?: string;
}

export interface Chat {
  id: number;
  title: string;
}

const ChatPage = () => {
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const db = useSQLiteContext();
  const [loadingInitialization, setLoadingInitialization] = useState(false);
  const [summaryContext, setSummaryContext] = useState("");
  const { id: personaId } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("Blissm");
  const listRef = useRef<FlashList<Message>>(null);
  const insets = useSafeAreaInsets();

  // Session and messages initialization
  useEffect(() => {
    setLoadingInitialization(true);
    const initializeSession = async () => {
      if (!personaId) return;
      try {
        const existingSession = await db.getFirstAsync<{
          id: number;
          system_instructions: string;
        }>(
          `SELECT id, system_instructions FROM chatSessions WHERE persona_id = ?`,
          [personaId]
        );
        if (existingSession) {
          console.log("Using existing session:", existingSession.id);
          setChatId(existingSession.id);
          return;
        }
        console.log(`personaId: ${personaId}`);
        const docRef = doc(FIRESTORE_DB, "personas", personaId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error("Persona not found, firebase");
        const personaData = docSnap.data();
        console.log("Persona data:", personaData);
        const result = await db.runAsync(
          `INSERT INTO chatSessions 
          (persona_id, system_instructions, title, summary) 
          VALUES (?, ?, ?, ?)`,
          [personaId, personaData.system_instructions, personaData.title, ""]
        );
        if (result.lastInsertRowId) {
          console.log("Created new session:", result.lastInsertRowId);
          setChatId(result.lastInsertRowId);
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
      } finally {
        setLoadingInitialization(false);
      }
    };
    initializeSession();
  }, [personaId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      try {
        const chat = await getChatById(db, chatId);
        if (!chat) return;
        const transformedMessages = chat.messages.flatMap((msg) => [
          { role: Role.User, content: msg.user_prompt },
          { role: Role.Bot, content: msg.bot_response },
        ]);
        setMessages(transformedMessages);
        setSummaryContext(chat.summary);
        setTitle(chat.title);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, [chatId]);

  const fetchChatGPTCompletion = async (prompt: string) => {
    try {
      const history = await getLastTwoExchanges(db, chatId);
      const summary = summaryContext;
      console.info("Last two exchanges", history);
      console.info("Old Summary", summary);
      const url = `https://api.openai.com/v1/chat/completions`;
      const body = JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstructions },
          { role: "system", content: summary },
          ...history,
          { role: "user", content: prompt },
        ],
      });
      console.warn("Request Body:", body);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API}`,
        },
        body,
      });
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const data = await response.json();
      const responseText =
        data.choices[0]?.message?.content || "No response available";
      console.log("API Response:", data);
      setMessages((prev) => [
        ...prev,
        { role: Role.Bot, content: responseText },
      ]);
      await addChat(db, chatId, prompt, responseText);
      await summarize(prompt, responseText, summary);
    } catch (error) {
      console.error("Failed to fetch completion:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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
        max_tokens: 300,
      });
      console.log("Sending summarize request...");
      console.warn("Request Body Summary:", body);
      const responseData = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API}`,
        },
        body,
      });
      if (!responseData.ok) {
        throw new Error(`Summarize API failed: ${responseData.status}`);
      }
      const data = await responseData.json();
      console.log("Summarize Response:", data);
      const newSummary = data.choices[0]?.message?.content || oldSummary;
      setSummaryContext(newSummary);
      console.log("Summary successfully set", newSummary);
    } catch (error) {
      console.error("Failed to summarize:", error);
      return oldSummary;
    }
  };

  const getCompletion = async (prompt: string) => {
    setMessages((prev) => [...prev, { role: Role.User, content: prompt }]);
    setLoading(true);
    try {
      await fetchChatGPTCompletion(prompt);
    } catch (error) {
      console.error("Error fetching completion:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/back.jpeg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={defaultStyles.pageContainer}>
        <Stack.Screen
          options={{
            statusBarBackgroundColor: Colors.primary,
            header: () => (
              <View style={styles.headerContainer}>
                <Ionicons
                  name="arrow-back-sharp"
                  color={Colors.light}
                  size={24}
                />
              </View>
            ),
          }}
        />
        {loadingInitialization ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.darkColor} />
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <FlashList
                ref={listRef}
                data={messages}
                renderItem={({ item }) => <ChatMessage {...item} />}
                estimatedItemSize={400}
                contentContainerStyle={styles.flashListContent}
                keyboardDismissMode="interactive"
                ListFooterComponent={
                  loading ? (
                    <View style={styles.loading}>
                      <BouncingDotsLoader />
                    </View>
                  ) : null
                }
              />
              {messages.length === 0 && (
                <MessageIdeas onSelectCard={getCompletion} />
              )}
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={insets.top + 10}
              >
                <MessageInput
                  onShouldSend={getCompletion}
                  onSendAudio={() => {}}
                />
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: "100%",
    padding: 10,
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexDirection: "row",
    backgroundColor: Colors.primary,
  },
  headerTitleContainer: {
    backgroundColor: Colors.light,
    paddingHorizontal: 5,
  },
  triggerText: {
    fontSize: 18,
    color: Colors.primary,
    overflow: "hidden",
    fontFamily: "Poppins-Bold",
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  flashListContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    height: 30,
  },
});

export default ChatPage;
