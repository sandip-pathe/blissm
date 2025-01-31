import Colors from "@/constants/Colors";
import { useEffect, useState } from "react";
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
import React from "react";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "@/FirebaseConfig";

interface PromptsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  category: string;
  entries: string[];
}

const PromptsModal = ({
  visible,
  onClose,
  onSelectPrompt,
}: PromptsModalProps) => {
  const [prompts, setPrompts] = useState<PromptCategory[]>([]);
  const [selected, setSelected] = useState<PromptCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
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

    if (visible) fetchPrompts();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal style={styles.modalContainer} transparent>
      <BlurView intensity={60} tint="light" style={styles.blurContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Getting Started Prompts</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.dark} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
              >
                {prompts.map((section, index) => (
                  <TouchableOpacity
                    key={index}
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
                          color={Colors.dark}
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
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  blurContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.lightPink,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    width: "100%",
    height: "75%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderBottomColor: Colors.input,
    borderBottomWidth: 1,
  },
  modalTitle: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: "600",
    color: Colors.dark,
  },
  closeButton: {
    backgroundColor: Colors.input,
    borderRadius: 16,
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
    color: Colors.dark,
  },
  sectionBtn: {
    backgroundColor: Colors.input,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBtnSelected: {
    backgroundColor: Colors.primary,
  },
  sectionBtnText: {
    color: Colors.dark,
    fontWeight: "500",
  },
  sectionBtnTextSelected: {
    color: Colors.lightPink,
    fontWeight: "500",
  },
  card: {
    borderRadius: 8,
    backgroundColor: Colors.input,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cardTextContainer: {
    flexShrink: 1,
    gap: 4,
  },
  cardAuthor: {
    fontSize: 14,
    color: Colors.grey,
  },
});

export default PromptsModal;
