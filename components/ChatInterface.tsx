// ChatInterface.tsx
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Text,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { orchestrator } from "../agents/orchestrator";
import { useUser } from "../hooks/useConversation";
import { responseGenerator } from "../agents/responseGenerator";
import { inputHandler } from "../agents/inputHandler";
import { MessageBubble } from "./messageBubble";
import AudioPlayer from "./AudioPlayer";
import AudioRecorder from "./AudioRecorder";
import { MaterialIcons } from "@expo/vector-icons";

export const ChatInterface = () => {
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const { userId } = useUser();

  const audioPlayerRef = useRef<{
    play: (base64Audio: string) => Promise<void>;
  }>(null);
  const audioRecorderRef = useRef<{
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
  }>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Process through agent pipeline
      const { response } = await orchestrator(userId, input);

      // Generate response with TTS if enabled
      const { textResponse, audioContent } = await responseGenerator(
        response,
        userId
      );

      // Add bot response
      setMessages((prev) => [...prev, { text: textResponse, isUser: false }]);

      // Play audio if available
      if (audioContent && audioPlayerRef.current) {
        await audioPlayerRef.current.play(audioContent);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an issue. Please try again.",
          isUser: false,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, userId]);

  const handleVoiceInput = useCallback(
    async (audioUri: string) => {
      setIsProcessing(true);
      setShowRecordingModal(false);

      try {
        // Convert audio URI to blob
        const audioResponse = await fetch(audioUri);
        const audioBlob = await audioResponse.blob();

        const nluOutput = await inputHandler(audioBlob);
        setInput(nluOutput.rawText);

        // Add user message
        setMessages((prev) => [
          ...prev,
          { text: nluOutput.rawText, isUser: true },
        ]);

        // Continue with orchestration
        const { response } = await orchestrator(userId, nluOutput);
        const { textResponse, audioContent } = await responseGenerator(
          response,
          userId
        );

        setMessages((prev) => [...prev, { text: textResponse, isUser: false }]);

        if (audioContent && audioPlayerRef.current) {
          await audioPlayerRef.current.play(audioContent);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Sorry, I couldn't process your audio. Please try again.",
            isUser: false,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [userId]
  );

  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setShowRecordingModal(true);
  }, []);

  const handleRecordingStop = useCallback(() => {
    setIsRecording(false);
  }, []);

  const closeRecordingModal = useCallback(() => {
    if (isRecording) {
      audioRecorderRef.current?.stopRecording();
    }
    setShowRecordingModal(false);
  }, [isRecording]);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble text={item.text} isUser={item.isUser} />
        )}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messagesContainer}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          style={styles.input}
          editable={!isProcessing}
          onSubmitEditing={handleSend}
        />

        <AudioRecorder />

        <Button
          title={isProcessing ? "Sending..." : "Send"}
          onPress={handleSend}
          disabled={isProcessing || !input.trim()}
        />
      </View>

      <AudioPlayer />

      {/* Recording Modal */}
      <Modal
        visible={showRecordingModal}
        transparent
        animationType="fade"
        onRequestClose={closeRecordingModal}
      >
        <TouchableWithoutFeedback onPress={closeRecordingModal}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <View style={styles.recordingAnimation}>
                <MaterialIcons name="mic" size={100} color="#2196F3" />
                {isRecording && <View style={styles.pulse} />}
              </View>
              <Text style={styles.recordingText}>
                {isRecording ? "Recording..." : "Processing..."}
              </Text>
              <Text style={styles.tapToStop}>Tap anywhere to stop</Text>

              {!isRecording && (
                <ActivityIndicator
                  size="large"
                  color="#2196F3"
                  style={styles.loader}
                />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  messagesContainer: {
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "white",
    borderRadius: 25,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    padding: 12,
    marginRight: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
  },
  recordingAnimation: {
    position: "relative",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 75,
    backgroundColor: "rgba(33, 150, 243, 0.3)",
    zIndex: -1,
  },
  recordingText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  tapToStop: {
    color: "#666",
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
});
