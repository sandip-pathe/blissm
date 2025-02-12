import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "@/FirebaseConfig";
import Colors from "@/constants/Colors";

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
              <Ionicons name="close" size={28} color={Colors.dark} />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
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
                          color={Colors.light}
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

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.primary,
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
    borderBottomColor: Colors.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light,
  },
  closeButton: {
    backgroundColor: Colors.light,
    borderRadius: 16,
  },
  loader: {
    marginTop: 20,
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
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.light,
  },
  sectionBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionBtnSelected: {
    backgroundColor: Colors.secondary,
  },
  sectionBtnText: {
    color: Colors.light,
    fontFamily: "Poppins-Regular",
  },
  sectionBtnTextSelected: {
    fontWeight: "bold",
  },
  card: {
    borderRadius: 8,
    backgroundColor: Colors.secondary,
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
    color: Colors.light,
    fontFamily: "Poppins-Regular",
  },
});

export default PromptsModal;
