import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { Animated, Easing } from "react-native";

interface MessageInputProps {
  onShouldSend: (message: string) => void;
  onRecordPress: () => void;
  isLoading: boolean;
  isRecording: boolean;
}

const MessageInput = ({
  onShouldSend,
  onRecordPress,
  isLoading,
  isRecording,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);
  const { colors } = useTheme();
  const scale = usePulseAnimation();
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

  return (
    <View style={styles.row}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          placeholder="What's on your mind?"
          style={styles.messageInput}
          onChangeText={onChangeText}
          value={message}
          numberOfLines={5}
          autoFocus
          scrollEnabled
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
            onPress={onRecordPress}
            disabled={isLoading}
            style={styles.recordButton}
          >
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Listening...</Text>
                <Animated.View
                  style={[styles.pulsatingCircle, { transform: [{ scale }] }]}
                />
              </View>
            ) : (
              <Ionicons name="mic" size={28} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const usePulseAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  return scale;
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
      minWidth: 100,
      maxHeight: 100,
      minHeight: 40,
      fontSize: 16,
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
    recordingIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    recordingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "red",
      marginRight: 8,
    },
    recordingText: {
      color: "red",
      fontWeight: "500",
    },
    recordButton: {
      padding: 10,
      marginRight: 8,
    },
    pulsatingCircle: {
      position: "absolute",
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "rgba(255, 0, 0, 0.3)",
    },
  });

export default MessageInput;
