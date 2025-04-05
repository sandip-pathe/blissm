import { View, Text, StyleSheet } from "react-native";
import BouncingDotsLoader from "./BouncingDotsLoader";
import { useTheme } from "@react-navigation/native";

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
  fontSize,
}: Message & { loading?: boolean; fontSize: number }) => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  return (
    <View
      style={[styles.row, role === Role.User ? styles.userRow : styles.botRow]}
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
          <Text style={[styles.text, { fontSize }]}>{content}</Text>
        </View>
      )}
    </View>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginVertical: 8,
      paddingHorizontal: 16,
    },
    userRow: {
      flexDirection: "row-reverse",
    },
    botRow: {
      flexDirection: "row",
    },
    bubble: {
      maxWidth: "80%",
      padding: 10,
      borderRadius: 15,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderEndStartRadius: 0,
    },
    botBubble: {
      backgroundColor: colors.card,
      borderStartStartRadius: 0,
    },
    text: {
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    loading: {
      alignSelf: "flex-end",
      justifyContent: "center",
      alignItems: "center",
      height: 30,
    },
  });

export default ChatMessage;
