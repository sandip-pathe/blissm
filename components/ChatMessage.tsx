import Colors from "@/constants/Colors";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

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

const ChatMessage = ({
  content,
  role,
  loading,
}: Message & { loading?: boolean }) => {
  return (
    <View
      style={[
        styles.row,
        { alignSelf: role === Role.User ? "flex-end" : "flex-start" },
      ]}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <View
          style={[
            styles.bubble,
            role === Role.User ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text style={styles.text}>{content}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
    paddingHorizontal: 14,
  },
  bubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 15,
  },
  userBubble: {
    backgroundColor: "#D6EAF8",
    alignSelf: "flex-end",
    borderEndStartRadius: 0,
  },
  botBubble: {
    backgroundColor: "#FDEDEC",
    alignSelf: "flex-start",
    borderStartStartRadius: 0,
  },
  text: {
    color: "#2C3E50",
    fontFamily: "Poppins-Regular",
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    height: 30,
  },
});

export default ChatMessage;
