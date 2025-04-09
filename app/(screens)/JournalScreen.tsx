import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addJournalContent,
  addJournalSession,
  addJournalSummary,
  backgroundColorUpdate,
  deleteJournalContent,
  getJournalById,
  getLastTwoJournalExchanges,
} from "@/database/sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useTheme } from "@react-navigation/native";
import PromptsModal from "../(modals)/promptsModal";
import ColorPickerModal from "../(modals)/colorPicker";
import BouncingDotsLoader from "@/components/BouncingDotsLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { posthog } from "@/constants/posthogConfig";
import "react-native-get-random-values";
import { v7 as uuidv7 } from "uuid";
import {
  fetchInstructionsJournal,
  fetchSummaryInstructionsJournal,
  storeChatInFirestore,
} from "../(chat)/chatHelper";
import { useCustomAuth } from "@/components/authContext";
import ActionModal from "../(modals)/actionModal";
import AlertModal from "../(modals)/deleteModal";
import { useColorScheme } from "@/hooks/useColorScheme";
import Constants from "expo-constants";

const getSettings = async () =>
  JSON.parse((await AsyncStorage.getItem("journalSettings")) || "{}") || {
    light: "#ffffff",
    dark: "#000000",
    fontSize: 16,
  };

export interface Message {
  uuid: string;
  text: string;
  role: number;
  edited?: number;
  reactions?: string;
}

const OPENAI_API = Constants?.expoConfig?.extra?.OPENAI_API;

const JournalScreen: React.FC = () => {
  const { currentUser } = useCustomAuth();
  const scrollRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef<number>(0);
  const db = useSQLiteContext();
  let { id } = useLocalSearchParams<{ id: string }>();
  const [journalId, setJournalId] = useState<string | undefined>(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const latestPromptsRef = useRef("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingInitialization, setLoadingInitialization] = useState(true);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<string>();
  const [bg, setBg] = useState<string>();
  const [journalPromptInstructions, setJournalPromptInstructions] =
    useState<string>("");
  const [summaryInstructions, setSummaryInstructions] = useState<string>("");
  const [initialPromptId, setInitialPromptId] = useState<string>("");
  const [summaryContext, setSummaryContext] = useState("");
  const [fontSize, setFontSize] = useState<number>(16);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const lastInputLength =
    messages.length > 0 ? messages[messages.length - 1].text.length : 0;
  const [modal2Visible, setModal2Visible] = useState(false);
  const [modalActions, setModalActions] = useState([]);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const colorScheme = useColorScheme();

  useEffect(() => {
    getSettings().then((set) => {
      setFontSize(set.fontSize);
      colorScheme === "dark"
        ? setBackgroundColor(set.dark)
        : setBackgroundColor(set.light);
      colorScheme === "dark" ? setBg(set.light) : setBg(set.dark);
      console.log(set.light, set.dark);
      console.log(`colorScheme:`, colorScheme);
    });
  }, []);

  const handlePromptSelect = async (prompt: string) => {
    if (messages[0].uuid === initialPromptId) {
      messages[0].text = prompt;
      try {
        await db.runAsync(
          `UPDATE journalContentsTable SET content = ? WHERE uuid = ?`,
          [prompt, initialPromptId]
        );
      } catch (error) {
        console.error("Error updating init prompt:", error);
      }
    }

    setShowPromptsModal(false);
    posthog.capture("prompt_selected", { prompt });
  };

  const handleAddPrompt = () => {
    Keyboard.dismiss();
    setShowPromptsModal(true);
  };

  const handleBGChange = async (color: any) => {
    const selectedColor = colorScheme === "dark" ? color.dark : color.light;
    setBackgroundColor(selectedColor);
    backgroundColorUpdate(db, parseInt(journalId!), color.dark, color.light);
  };

  useEffect(() => {
    const initializeJournal = async () => {
      setLoadingInitialization(true);
      try {
        if (journalId) {
          console.log("🔄 Fetching Journal Data for ID:", journalId);
          const journal = await getJournalById(db, parseInt(journalId));
          if (journal?.messages) {
            console.log("✅ Loaded Existing Journal:", journal);
            colorScheme === "dark"
              ? setBackgroundColor(journal.dark)
              : setBackgroundColor(journal.light);
            setMessages(journal.messages);
            setSummaryContext(journal.summary);
            const userUUID = uuidv7();
            setMessages((prev) => [
              ...prev,
              {
                uuid: userUUID,
                role: 1,
                text: "",
                edited: 0,
                reactions: "",
              },
            ]);
          } else {
            console.warn("⚠️ No messages found for Journal ID:", journalId);
          }
        } else {
          console.log("🆕 Creating New Journal Session");

          const journalInstructions = await fetchInstructionsJournal();
          const summaryInstructions = await fetchSummaryInstructionsJournal();

          const newId = await addJournalSession(
            db,
            `Journal ${new Date().toLocaleDateString()}`,
            journalInstructions,
            summaryInstructions,
            backgroundColor,
            bg
          );

          console.log("✅ Created Journal ID:", newId);

          const botUUID = uuidv7();
          const userUUID = uuidv7();

          setInitialPromptId(botUUID);

          const initialMessages = [
            {
              uuid: botUUID,
              role: 0,
              text: "How was your day?",
              edited: 0,
              reactions: "",
            },
            {
              uuid: userUUID,
              role: 1,
              text: "",
              edited: 0,
              reactions: "",
            },
          ];

          setJournalId(newId.toString());
          setMessages(initialMessages);
          setSummaryInstructions(summaryInstructions);
          setJournalPromptInstructions(journalInstructions);
          await addJournalContent(db, newId, botUUID, "How was your day?", 0);
        }
      } catch (error) {
        console.error("❌ Error Initializing Journal:", error);
      } finally {
        setLoadingInitialization(false);
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    };

    initializeJournal();
  }, []);

  const handleInputChange = (text: string, messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.uuid === messageId ? { ...msg, text } : msg))
    );
  };

  const handleTrigger = async () => {
    const lastInputIndex = messages.length - 1;
    const lastUserInput = messages[lastInputIndex].text?.trim();
    console.log("Last User Input:", lastUserInput);
    if (!lastUserInput) {
      return;
    }
    await createNewPrompts(lastUserInput);
  };

  const confirmDeleteMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
    setDeleteModalVisible(true);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageId) return;

    try {
      await deleteJournalContent(db, selectedMessageId); // Delete from DB
      setMessages((prev) =>
        prev.filter((msg) => msg.uuid !== selectedMessageId)
      ); // Remove from UI
      console.log(`✅ Message ${selectedMessageId} deleted.`);
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const openOptions = (message) => {
    setModal2Visible(true);

    const actions = [
      {
        text: "Report",
        onPress: () => {
          Alert.alert("Reported");
        },
        icon: <Octicons name="report" color={colors.text} />,
      },
      {
        text: "Delete",
        onPress: () => confirmDeleteMessage(message.uuid),
        icon: <MaterialCommunityIcons name="delete" color={colors.text} />,
      },
    ];

    setModalActions(actions);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const createNewPrompts = async (userInput: string) => {
    setLoadingPrompt(true);
    setLoading(true);
    try {
      const history = await getLastTwoJournalExchanges(
        db,
        parseInt(journalId!)
      );

      const url = `https://api.openai.com/v1/chat/completions`;

      const body = JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: journalPromptInstructions },
          { role: "system", content: summaryContext },
          ...history,
          { role: "user", content: userInput },
        ],
        max_tokens: 100,
        stream: false,
      });

      console.log("Prompt Body:", body);

      const responseData = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API}`,
        },
        body,
      });

      if (!responseData.ok) {
        throw new Error(`Prompt API failed: ${responseData.status}`);
      }

      const userUUID = uuidv7();

      const data = await responseData.json();

      const botPrompt =
        data.choices[0]?.message?.content || "Add more light to it.";

      console.log(`5a new Response:`, botPrompt);

      const botUUID = uuidv7();

      setLoading(false);

      setMessages((prev) => [
        ...prev,
        {
          uuid: botUUID,
          role: 0,
          text: botPrompt,
          edited: 0,
          reactions: "",
        },
        {
          uuid: userUUID,
          role: 1,
          text: "",
          edited: 0,
          reactions: "",
        },
      ]);

      latestPromptsRef.current = botPrompt;

      await addJournalContent(db, parseInt(journalId!), userUUID, userInput, 1);

      await addJournalContent(db, parseInt(journalId!), botUUID, botPrompt, 0);

      const { newSummary, summaryTokenUsage } = await summarize(
        userInput,
        botPrompt,
        summaryContext
      );

      const tokenUsage = {
        total: data.usage?.total_tokens || 0,
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        system:
          (journalPromptInstructions.length + summaryContext.length) / 4 || 0,
      };

      await storeChatInFirestore(currentUser?.uid, journalId, {
        user: userInput,
        bot: botPrompt,
        summary: newSummary,
        tokenUsage,
        summaryTokenUsage,
        model: "gpt-4o",
        responseTimeMs: data.response_time || 0,
      });
    } catch (error) {
      console.error("Failed to create prompt:", error);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const summarize = async (
    userInput: string,
    botResponse: string,
    oldSummary?: any
  ) => {
    try {
      const url = `https://api.openai.com/v1/chat/completions`;

      // Default structured format if no previous summary exists
      const defaultSummary = {
        emotions: [], // e.g., ["anxiety before presentation", "happiness around family"]
        majorEvents: [], // e.g., ["broke up with Suchita", "switched job"]
        keyDiscussions: [], // e.g., ["fear of failure", "negative self-talk"]
        cbtExercises: [], // e.g., ["thought journaling", "exposure therapy"]
        followUps: [], // e.g., ["track progress on social confidence"]
        userObjectives: [], // e.g., ["manage social anxiety", "build confidence"]
      };

      // Ensure oldSummary is properly structured
      const previousSummary = oldSummary
        ? JSON.stringify(oldSummary)
        : JSON.stringify(defaultSummary);

      const body = JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content: summaryInstructions,
          },
          {
            role: "user",
            content: `Previous Summary (JSON): ${previousSummary}\n\nNew Exchange:\nUser: ${userInput}\nBot: ${botResponse}\n\nUpdate the summary while maintaining previous context. Return only JSON format.`,
          },
        ],
        max_tokens: 300,
      });

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
      const newSummary = data.choices[0]?.message?.content || previousSummary;

      // Store the structured summary in Firestore
      await addJournalSummary(db, JSON.parse(newSummary), parseInt(journalId!));

      const summaryTokenUsage = {
        total: data.usage?.total_tokens || 0,
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        system: summaryInstructions.length / 4 || 0,
      };

      console.log("Updated Summary (JSON):", newSummary);

      return { newSummary: JSON.parse(newSummary), summaryTokenUsage };
    } catch (error) {
      console.error("Failed to summarize:", error);
      return oldSummary;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          statusBarBackgroundColor: backgroundColor,
          header: () => (
            <View style={[styles.header, { backgroundColor }]}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={colors.text}
                  onPress={() => {
                    router.back();
                  }}
                />
                <Text style={styles.triggerText}>
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Ionicons
                  name="color-palette-outline"
                  size={30}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <PromptsModal
        visible={showPromptsModal}
        onClose={() => setShowPromptsModal(false)}
        onSelectPrompt={handlePromptSelect}
      />
      <ColorPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onChangeBackgroundColor={handleBGChange}
      />
      <View style={[styles.container, { backgroundColor }]}>
        {loadingInitialization ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingBottom: contentHeightRef.current ? 150 : 0 },
            ]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <TouchableWithoutFeedback
                key={`prompt-item-${message.uuid}`}
                onLongPress={() => openOptions(message)}
              >
                {message.role === 0 ? (
                  <View style={styles.promptContainer}>
                    {index === 0 &&
                      messages.length === 2 &&
                      !messages[1].text.trim() && (
                        <TouchableOpacity
                          onPress={handleAddPrompt}
                          style={styles.triggerButton}
                        >
                          <Text style={[styles.triggerText, { fontSize: 16 }]}>
                            Pick a Prompt
                          </Text>
                        </TouchableOpacity>
                      )}

                    <Text style={[styles.promptText, { fontSize }]}>
                      {message.text}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputContainer}>
                    <TextInput
                      autoFocus={
                        index === messages.length - 1 && messages.length > 0
                      }
                      style={[styles.input, { fontSize }]}
                      placeholder="Start writing..."
                      placeholderTextColor={colors.text}
                      keyboardAppearance="dark"
                      cursorColor={colors.text}
                      multiline
                      autoCorrect={false}
                      value={message.text || ""}
                      onChangeText={(text) =>
                        handleInputChange(text, message.uuid)
                      }
                    />
                  </View>
                )}
              </TouchableWithoutFeedback>
            ))}
            <View style={styles.spacer}></View>
          </ScrollView>
        )}
        <TouchableOpacity
          style={[
            styles.iconButton,
            loadingPrompt || lastInputLength == 0
              ? styles.disabledButton
              : null,
          ]}
          onPress={handleTrigger}
          disabled={loadingPrompt || lastInputLength == 0}
        >
          {loading ? (
            <BouncingDotsLoader />
          ) : (
            <>
              <FontAwesome5 name="magic" size={30} color={colors.text} />
            </>
          )}
        </TouchableOpacity>
      </View>
      <ActionModal
        visible={modal2Visible}
        onClose={() => setModal2Visible(false)}
        actions={modalActions}
      />
      <AlertModal
        visible={isDeleteModalVisible}
        title="Delete Entry"
        message="Are you sure you want to delete this journal entry?"
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default JournalScreen;

const themedStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    emptyStateContainer: {
      flex: 1,
    },
    iconButton: {
      position: "absolute",
      bottom: 10,
      right: 10,
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 50,
      elevation: 5,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    header: {
      width: "100%",
      padding: 10,
      justifyContent: "space-between",
      alignItems: "flex-end",
      flexDirection: "row",
      fontFamily: "Poppins-Regular",
      color: colors.text,
    },
    input: {
      color: colors.text,
      textAlign: "left",
      fontFamily: "Poppins-Regular",
    },
    promptContainer: {
      borderRadius: 10,
      paddingVertical: 5,
      alignSelf: "flex-start",
      alignContent: "flex-start",
      paddingLeft: 5,
      color: colors.text,
    },
    promptText: {
      textAlign: "auto",
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
    triggerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    disabledButton: {
      opacity: 0.3,
    },
    triggerText: {
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingTop: 30,
      gap: 20,
    },
    bottomBarContainer: {
      position: "absolute",
      bottom: 3,
      right: 5,
      width: "100%",
    },
    inputContainer: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-start",
      height: "100%",
    },
    spacer: {
      height: 60,
    },
    loader: {
      alignSelf: "center",
    },
  });
