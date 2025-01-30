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
} from "react-native";
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
import { Entypo, Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "@/FirebaseConfig";

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
  let { id: personaId } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("Blissm");
  const listRef = useRef<FlashList<Message>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
    setLoadingInitialization(false);
  }, [chatId]);

  const fetchChatGPTCompletion = async (prompt: string) => {
    try {
      const history = await getLastTwoExchanges(db, chatId);
      const summary = summaryContext;

      console.info("2 last exchanges", history);
      console.info("3 oldSummary", summary);

      const url = `https://api.openai.com/v1/chat/completions`;
      const body = JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemInstructions,
          },
          {
            role: "system",
            content: summary,
          },
          ...history,
          { role: "user", content: prompt },
        ],
      });

      console.warn("4 Request Body:", body);

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

      console.log("5 Response:", data);

      setMessages((prev) => [
        ...prev,
        { role: Role.Bot, content: responseText },
      ]);

      setLoading(false);
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
  }, [messages, keyboardHeight]);

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
          {
            role: "system",
            content: summaryInstructions,
          },
          {
            role: "user",
            content: `Old Summary: ${
              oldSummary || "No Old Summary"
            }\n\nNew Exchange:\nUser: ${prompt}\nBot: ${response}`,
          },
        ],
        max_tokens: 300,
      });

      console.log("6 Sending summarize request...");
      console.warn("7 Request Body Summary:", body);
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
      console.log("8 Summarize Response:", data);
      const newSummary = data.choices[0]?.message?.content || oldSummary;
      setSummaryContext(newSummary);
      console.log("9 Summary successfully set", newSummary);
    } catch (error) {
      console.error("Failed to summarize:", error);
      return oldSummary;
    }
  };

  const getCompletion = async (prompt: string) => {
    const userMessage: Message = {
      role: Role.User,
      content: prompt,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
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
    <>
      <Stack.Screen
        options={{
          statusBarBackgroundColor: Colors.lightPink,
          header: () => (
            <View
              style={{
                width: "100%",
                padding: 10,
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexDirection: "row",
                backgroundColor: Colors.lightPink,
              }}
            >
              <Ionicons
                name="arrow-back-sharp"
                color={Colors.light}
                size={24}
              />
              <View
                style={{ backgroundColor: Colors.light, paddingHorizontal: 5 }}
              >
                <Text style={styles.triggerText}>{title}</Text>
              </View>
              <TouchableOpacity style={styles.triggerButton}>
                <Ionicons name="settings" size={24} color={Colors.light} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {loadingInitialization && (
        <View>
          <ActivityIndicator size="large" color={Colors.darkColor} />
        </View>
      )}
      <View style={defaultStyles.pageContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
          style={styles.inputContainer}
        >
          <View style={styles.page}>
            <FlashList
              showsVerticalScrollIndicator
              ref={listRef}
              data={messages}
              renderItem={({ item }) => <ChatMessage {...item} />}
              estimatedItemSize={400}
              contentContainerStyle={{
                paddingTop: 10,
              }}
              keyboardDismissMode="interactive"
              ListFooterComponent={
                loading ? (
                  <View style={styles.loading}>
                    <ActivityIndicator size="large" color={Colors.darkColor} />
                  </View>
                ) : null
              }
            />
          </View>
          {messages.length === 0 && (
            <MessageIdeas onSelectCard={getCompletion} />
          )}
          <MessageInput onShouldSend={getCompletion} />
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  image: {
    width: 30,
    height: 30,
    resizeMode: "cover",
  },
  page: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    height: 30,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  triggerText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "bold",
    textOverflow: "truncate",
  },
});

export default ChatPage;
