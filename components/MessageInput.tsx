import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useRef, useState } from "react";
import { useTheme } from "@react-navigation/native";

export type Props = {
  onShouldSend: (message: string) => void;
  onSendAudio: (audioUri: string) => void;
  isLoading?: boolean;
};

const MessageInput = ({ onShouldSend, onSendAudio, isLoading }: Props) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [recording, setRecording] = useState<null>(null);
  const { colors } = useTheme();
  const styles = themedStyles(colors);

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
    {
    }
  };

  const stopRecording = async () => {
    {
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
          cursorColor={colors.text}
          placeholderTextColor={colors.border}
          editable={!isLoading}
        />
      </View>
      <View style={{ ...styles.buttonContainer, opacity: isLoading ? 0.5 : 1 }}>
        {message.length > 0 ? (
          <TouchableOpacity onPress={onSend} disabled={isLoading}>
            <Ionicons name="send-sharp" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={recording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            <FontAwesome5
              name="microphone"
              size={24}
              color={recording ? colors.notification : colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
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
      borderRadius: 20,
      backgroundColor: colors.card,
      paddingVertical: 5,
    },
    messageInput: {
      flex: 1,
      marginHorizontal: 10,
      fontFamily: "Poppins-Regular",
      color: colors.text,
    },
    buttonContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      borderRadius: 20,
      backgroundColor: colors.card,
      width: 50,
      height: 50,
    },
  });

export default MessageInput;
