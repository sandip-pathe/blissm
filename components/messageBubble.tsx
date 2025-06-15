import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MessageBubbleProps {
  text: string;
  isUser: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isUser,
}) => {
  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.botContainer,
      ]}
    >
      <Text style={isUser ? styles.userText : styles.botText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 8,
  },
  userContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    borderBottomRightRadius: 0,
  },
  botContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 0,
  },
  userText: {
    color: "#000",
  },
  botText: {
    color: "#000",
  },
});
