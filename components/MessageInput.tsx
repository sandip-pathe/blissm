import Colors from "@/constants/Colors";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { Audio } from "expo-av";

export type Props = {
  onShouldSend: (message: string) => void;
  onSendAudio: (audioUri: string) => void;
};

const MessageInput = ({ onShouldSend, onSendAudio }: Props) => {
  const [message, setMessage] = useState("");
  const { bottom } = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const onChangeText = (text: string) => {
    setMessage(text);
  };

  const onSend = () => {
    if (message.trim().length > 0) {
      onShouldSend(message);
      setMessage("");
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.warn("Permission to access microphone is required");
        return;
      }

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  const stopRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) onSendAudio(uri);
      setRecording(null);
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          placeholder="Message"
          style={styles.messageInput}
          onChangeText={onChangeText}
          value={message}
          multiline
          cursorColor={"#8097A1"}
          placeholderTextColor={"#8097A1"}
        />
      </View>
      <View style={styles.buttonContainer}>
        {message.length > 0 ? (
          <TouchableOpacity onPress={onSend}>
            <Ionicons name="send-sharp" size={24} color={Colors.accent2} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={recording ? stopRecording : startRecording}
          >
            <FontAwesome5
              name="microphone"
              size={24}
              color={recording ? "red" : Colors.accent2}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 5,
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#1C2D35",
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    fontFamily: "Poppins-Regular",
    color: Colors.light,
  },
  buttonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#1C2D35",
    width: 50,
    height: 50,
  },
});

export default MessageInput;
