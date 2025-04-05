import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "../../constants/firebaseConf";
import BouncingDotsLoader from "@/components/BouncingDotsLoader";
import { useTheme } from "@react-navigation/native";

interface PromptsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  category: string;
  entries: string[];
}

const PromptsModal: React.FC<PromptsModalProps> = ({
  visible,
  onClose,
  onSelectPrompt,
}) => {
  const [prompts, setPrompts] = useState<PromptCategory[]>([]);
  const [selected, setSelected] = useState<PromptCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const styles = themedStyles(colors);

  useEffect(() => {
    if (!visible) return;

    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(
          collection(FIRESTORE_DB, "prompts")
        );
        const fetchedPrompts: PromptCategory[] = querySnapshot.docs.map(
          (doc) => ({
            category: doc.data().category || "",
            entries: doc.data().prompts || [],
          })
        );

        setPrompts(fetchedPrompts);
        setSelected(fetchedPrompts[0] || null);
      } catch (error) {
        console.error("Error fetching prompts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent>
      <BlurView intensity={60} tint="light" style={styles.blurContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Getting Started Prompts</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading ? (
            <View style={styles.loader}>
              <BouncingDotsLoader />
            </View>
          ) : (
            <>
              {/* Category Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
              >
                {prompts.map((section) => (
                  <TouchableOpacity
                    key={section.category}
                    onPress={() => setSelected(section)}
                    style={[
                      styles.sectionBtn,
                      selected?.category === section.category &&
                        styles.sectionBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionBtnText,
                        selected?.category === section.category &&
                          styles.sectionBtnTextSelected,
                      ]}
                    >
                      {section.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Prompts List */}
              <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {selected && (
                  <Animated.View
                    entering={FadeIn.duration(40).delay(30)}
                    exiting={FadeOut.duration(70)}
                  >
                    <Text style={styles.title}>{selected.category}</Text>
                    {selected.entries.map((prompt, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => onSelectPrompt(prompt)}
                      >
                        <Ionicons
                          name="caret-forward-sharp"
                          size={24}
                          color={colors.text}
                        />
                        <View style={styles.cardTextContainer}>
                          <Text style={styles.cardAuthor}>{prompt}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </Animated.View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const themedStyles = (colors) =>
  StyleSheet.create({
    blurContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      width: "100%",
      height: "75%",
      paddingBottom: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.text,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      opacity: 0.8,
    },
    loader: {
      marginTop: 20,
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
    },
    tabsContainer: {
      height: 60,
      paddingHorizontal: 12,
      paddingBottom: 16,
      paddingTop: 8,
      gap: 8,
    },
    contentContainer: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: "Poppins-Bold",
      marginBottom: 16,
      color: colors.text,
    },
    sectionBtn: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingHorizontal: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    sectionBtnSelected: {
      backgroundColor: colors.primary,
    },
    sectionBtnText: {
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    sectionBtnTextSelected: {
      fontFamily: "Poppins-Bold",
    },
    card: {
      borderRadius: 8,
      backgroundColor: colors.card,
      padding: 16,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    cardTextContainer: {
      flexShrink: 1,
    },
    cardAuthor: {
      fontSize: 14,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
  });

export default PromptsModal;
