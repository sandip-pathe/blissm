import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import {
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { FIRESTORE_DB } from "@/constants/firebaseConf";
import { useTheme } from "@react-navigation/native";

type Props = {
  onSelectCard: (message: string) => void;
  id: string;
};

const MessageIdeas = ({ onSelectCard, id }: Props) => {
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const [messages, setMessages] = useState<{ title: string; text: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStarters = async () => {
      if (!id) return;
      try {
        const docRef = doc(FIRESTORE_DB, "blissmates", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const starters = docSnap.data()?.starters || {};
          const formattedMessages = Object.entries(starters).map(
            ([title, text]) => ({ title, text: text as string })
          );
          setMessages(formattedMessages);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching starters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStarters();
  }, [id]);

  return (
    <View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {messages.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => onSelectCard(`${item.title} ${item.text}`)}
            >
              <Text ellipsizeMode="tail" numberOfLines={2} style={styles.title}>
                {item.title}
              </Text>
              <Text ellipsizeMode="tail" numberOfLines={2} style={styles.text}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      borderRadius: 10,
      width: 220,
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    container: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 16,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontFamily: "Poppins-Bold",
      wordWrap: "break-word",
    },
    text: {
      color: colors.border,
      fontSize: 14,
      fontFamily: "Poppins-Regular",
    },
  });

export default MessageIdeas;
