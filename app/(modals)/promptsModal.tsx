import Colors from "@/constants/Colors";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  RollInLeft,
} from "react-native-reanimated";
import React from "react";

const Prompts = [
  {
    category: "Gratitude",
    entries: [
      "What are three things you're grateful for today?",
      "Describe a moment today that brought you joy.",
      "Who is someone you're thankful for, and why?",
      "What is a small win you achieved recently?",
      "Write about something that made you smile today.",
      "Describe a moment today that brought you joy.",
      "Who is someone you're thankful for, and why?",
      "What is a small win you achieved recently?",
      "Write about something that made you smile today.",
    ],
  },
  {
    category: "Self-Reflection",
    entries: [
      "What is one challenge you overcame recently?",
      "How did you feel about yourself today, and why?",
      "Write about a lesson you learned this week.",
      "What is one thing you could improve on, and how?",
      "What does your ideal day look like?",
    ],
  },
  {
    category: "Emotions",
    entries: [
      "What emotions did you feel most strongly today?",
      "When was the last time you felt truly at peace?",
      "Describe a situation that made you feel frustrated.",
      "What made you feel proud of yourself today?",
      "Write about a memory that brings you comfort.",
    ],
  },
  {
    category: "Future Goals",
    entries: [
      "What are three goals you want to achieve this month?",
      "What is a skill you want to develop, and why?",
      "What does success look like for you in 5 years?",
      "What is a personal habit you'd like to improve?",
      "If you could accomplish anything, what would it be?",
    ],
  },
  {
    category: "Mental Health",
    entries: [
      "What is one thing you did to take care of yourself today?",
      "How would you describe your mental state this week?",
      "What does self-care look like for you?",
      "Write about a time you successfully managed stress.",
      "What is one positive affirmation you can focus on?",
    ],
  },
  {
    category: "Relationships",
    entries: [
      "Who is someone you appreciate, and why?",
      "Write about a meaningful conversation you had recently.",
      "What do you value most in your relationships?",
      "Describe a moment you felt connected to someone.",
      "What is one way you can strengthen a relationship?",
    ],
  },
  {
    category: "Creativity and Inspiration",
    entries: [
      "What is something that inspired you recently?",
      "If you could create anything, what would it be?",
      "Write about a dream or idea you had today.",
      "What is a book, movie, or song that motivates you?",
      "What does creativity mean to you?",
    ],
  },
];

interface PromptsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const PromptsModal = ({
  visible,
  onClose,
  onSelectPrompt,
}: PromptsModalProps) => {
  const [selected, setSelected] = useState(Prompts[0]);
  if (!visible) return null;

  return (
    <View style={styles.modalContainer}>
      <BlurView intensity={60} tint="light" style={styles.blurContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Getting Started Prompts</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {Prompts.map((section, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelected(section)}
                style={[
                  styles.sectionBtn,
                  selected === section && styles.sectionBtnSelected,
                ]}
              >
                <Text
                  style={[
                    styles.sectionBtnText,
                    selected === section && styles.sectionBtnTextSelected,
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
                  <AntDesign name="caretright" size={24} color="black" />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardAuthor}>{prompt}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </ScrollView>
        </View>
      </BlurView>
    </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  modalContent: {
    backgroundColor: Colors.lightPink,
    borderStartStartRadius: 16,
    borderEndStartRadius: 16,
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
    color: Colors.light,
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
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 40,
  },
  cardTextContainer: {
    flexShrink: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.dark,
  },
  cardAuthor: {
    fontSize: 14,
    color: Colors.grey,
  },
});

export default PromptsModal;
