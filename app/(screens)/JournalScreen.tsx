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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  OPENAI_API,
  journalPromptInstructions,
  summaryInstructions,
} from "@/constants/var";
import {
  addJournalContent,
  addJournalSession,
  addJournalSummary,
  getJournalById,
  getJournalSummary,
  getLastTwoJournalExchanges,
} from "@/database/sqlite";
import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";
import PromptsModal from "../(modals)/promptsModal";

const JournalScreen: React.FC = () => {
  const scrollRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef<number>(0);
  const db = useSQLiteContext();
  const [inputs, setInputs] = useState<string[]>([""]);
  const [prompts, setPrompts] = useState(["How was your day"]);
  let { id } = useLocalSearchParams<{ id: string }>();
  const [journalId, setJournalId] = useState<string | undefined>(id);
  const [lastInput, SetLastInput] = useState("");
  const [lastPrompt, SetLastPrompt] = useState("");
  const latestInputsRef = useRef(lastInput);
  const latestPromptsRef = useRef(lastPrompt);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingInitialization, setLoadingInitialization] = useState(true);
  const [session, setSession] = useState<any>();
  const [showPromptsModal, setShowPromptsModal] = useState(false);

  const handlePromptSelect = (prompt: string) => {
    prompts[0] = prompt;
    setShowPromptsModal(false);
  };

  const handleAddPrompt = () => {
    Keyboard.dismiss();
    setShowPromptsModal(true);
  };

  useEffect(() => {
    latestInputsRef.current = lastInput;
  }, [lastInput]);

  useEffect(() => {
    latestPromptsRef.current = lastPrompt;
  }, [lastPrompt]);

  useEffect(() => {
    (async () => {
      setLoadingInitialization(true);
      try {
        if (!journalId) {
          const newId = await addJournalSession(
            db,
            `Journal ${new Date().toLocaleDateString()}`
          );
          console.log(`1 new Id created:`, newId);
          setJournalId(newId?.toString());
          setPrompts(["How was your day?"]);
          setInputs([""]);
        } else {
          console.log(`2 param journal fetched:`, journalId);
          const journal = await getJournalById(db, parseInt(journalId!));
          if (journal) {
            console.log(`3 contents fetched:`, journal.contents);
            setSession(journal);
            setPrompts(
              journal.prompts?.length ? journal.prompts : ["How was your day?"]
            );
            setInputs(journal.inputs?.length ? journal.inputs : [""]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize journal session:", error);
      } finally {
        setLoadingInitialization(false);
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    })();
  }, [journalId]);

  useFocusEffect(
    React.useCallback(() => {
      const onBlur = async () => {
        if (!journalId) return;

        const lastUserInput = latestInputsRef.current.trim();
        const lastBotPrompt = latestPromptsRef.current;

        if (prompts.length === 1 && !lastUserInput) {
          console.log("No data to save: Only one prompt and no user input.");
          return;
        }

        try {
          if (lastUserInput && !lastBotPrompt) {
            await addJournalContent(
              db,
              parseInt(journalId),
              lastUserInput,
              lastBotPrompt
            );
            console.log("Saved with default prompt");
          } else if (!lastUserInput && lastBotPrompt) {
            await addJournalContent(
              db,
              parseInt(journalId),
              " ",
              lastBotPrompt
            );
            console.log("Saved with previous prompt");
          } else if (lastUserInput && lastBotPrompt) {
            await addJournalContent(
              db,
              parseInt(journalId),
              lastUserInput,
              lastBotPrompt
            );
            console.log("Saved input and prompt");
          }
        } catch (error) {
          console.error("Failed to save journal content:", error);
        }
      };

      return () => {
        onBlur().catch((error) => {
          console.error("Error during onBlur in cleanup:", error);
        });
      };
    }, [journalId, prompts])
  );

  const handleInputChange = (text: string, index: number) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = text;
      SetLastInput(text);
      latestInputsRef.current = text;
      return newInputs;
    });
  };

  const createNewPrompts = async (userInput: string) => {
    if (!userInput.trim()) {
      console.warn("Cannot generate a new prompt for empty input.");
      return;
    }
    setLoadingPrompt(true);
    try {
      const history = await getLastTwoJournalExchanges(db);
      const summary = await getJournalSummary(db);

      const url = `https://api.openai.com/v1/chat/completions`;

      const body = JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: journalPromptInstructions },
          { role: "system", content: summary },
          ...history,
          { role: "user", content: userInput },
        ],
        max_tokens: 50,
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
        throw new Error(`Prompt API failed: ${responseData.status}`);
      }

      const prevResponse = prompts[prompts.length - 1];
      console.log(`4 Response old:`, prevResponse);
      const data = await responseData.json();
      const botPrompt =
        data.choices[0]?.message?.content || "Add more light to it.";
      console.log(`5a new Response:`, botPrompt);

      setPrompts((prev) => {
        const updated = [...prev, botPrompt];
        SetLastPrompt(botPrompt);
        latestPromptsRef.current = botPrompt;
        return updated;
      });

      setInputs((prev) => [...prev, ""]);

      await addJournalContent(
        db,
        parseInt(journalId!),
        userInput,
        prevResponse
      );
      console.log(`6 new Response:`, botPrompt);
      await summarize(userInput, summary);
    } catch (error) {
      console.error("Failed to create prompt:", error);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleTrigger = async () => {
    const lastInputIndex = inputs.length - 1;
    const lastUserInput = inputs[lastInputIndex]?.trim();
    if (!lastUserInput) {
      console.warn(
        "No user input to generate a new prompt. Please enter text, HandleTrigger()"
      );
      return;
    }
    await createNewPrompts(lastUserInput);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [prompts, inputs]);

  const summarize = async (prompt: string, oldSummary?: any) => {
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
            }\n\nNew Exchange:\nUser: ${prompt}`,
          },
        ],
        max_tokens: 100,
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
      const newSummary = data.choices[0]?.message?.content || oldSummary;

      await addJournalSummary(db, newSummary);
    } catch (error) {
      console.error("Failed to summarize:", error);
      return oldSummary;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <View style={styles.header}>
              <View>
                <Text style={styles.triggerText}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.triggerButton}
                onPress={handleTrigger}
                disabled={loadingPrompt && lastInput.length == 0}
              >
                {loadingPrompt ? (
                  <ActivityIndicator size="small" color={Colors.light} />
                ) : (
                  <>
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={Colors.light}
                    />
                    <Text style={styles.triggerText}>Add Prompt</Text>
                  </>
                )}
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
      <View style={[styles.container]}>
        {loadingInitialization ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
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
            {prompts.map((prompt, index) => (
              <View key={`prompt-item-${index}`}>
                <View style={styles.promptContainer}>
                  {index === 0 && prompts.length < 2 && (
                    <TouchableOpacity onPress={handleAddPrompt}>
                      <Text style={styles.promptText}>Add Prompt</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.promptText}>{prompt}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    autoFocus={index === inputs.length - 1}
                    style={styles.input}
                    placeholder="Start writing..."
                    placeholderTextColor={Colors.light}
                    keyboardAppearance="dark"
                    cursorColor={Colors.light}
                    multiline
                    value={inputs[index] || ""}
                    onChangeText={(t) => handleInputChange(t, index)}
                  />
                </View>
              </View>
            ))}
            <View style={styles.spacer}></View>
          </ScrollView>
        )}
      </View>
    </>
  );
};

export default JournalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightPink,
  },
  header: {
    width: "100%",
    padding: 10,
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexDirection: "row",
    backgroundColor: Colors.lightPink,
  },
  input: {
    color: Colors.light,
    textAlign: "left",
    fontSize: 20,
  },
  promptContainer: {
    borderRadius: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    alignContent: "flex-start",
    paddingLeft: 5,
  },
  promptText: {
    fontSize: 20,
    fontWeight: "500",
    textAlign: "auto",
    color: Colors.light,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  triggerText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light,
    fontWeight: "bold",
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
    height: 150,
  },
  loader: {
    alignSelf: "center",
  },
});
