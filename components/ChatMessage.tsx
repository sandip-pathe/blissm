import Colors from "@/constants/Colors";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import BouncingDotsLoader from "./BouncingDotsLoader";

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
          <BouncingDotsLoader />
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
    backgroundColor: "#A17C65",
    alignSelf: "flex-end",
    borderEndStartRadius: 0,
  },
  botBubble: {
    backgroundColor: "#1C2733",
    alignSelf: "flex-start",
    borderStartStartRadius: 0,
  },
  text: {
    color: Colors.light,
    fontFamily: "Poppins-Regular",
    fontSize: 16,
  },
  loading: {
    alignSelf: "flex-end",
    justifyContent: "center",
    alignItems: "center",
    height: 30,
  },
});

export default ChatMessage;
