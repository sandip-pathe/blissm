import Colors from "@/constants/Colors";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import React from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";

interface PromptComponentProps {
  promptText: string;
  onNewPrompt: () => void;
}

const PromptComponent: React.FC<PromptComponentProps> = ({
  promptText,
  onNewPrompt,
}) => {
  return (
    <View>
      <Text style={styles.promptText}>{promptText}</Text>
      {/* <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.switchPrompt} onPress={onNewPrompt}>
          <MaterialIcons name="change-circle" size={24} color={Colors.light} />
          <Text style={{ color: Colors.light }}>New prompt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.templates}>
          <MaterialIcons
            name="lightbulb-circle"
            size={24}
            color={Colors.light}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.seeAll}>
          <MaterialCommunityIcons
            name="microsoft-xbox-controller-menu"
            size={24}
            color={Colors.light}
          />
          <Text style={{ color: Colors.light }}>See all</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  promptText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.input,
    textAlign: "auto",
  },
  switchPrompt: {
    flexDirection: "row",
    borderRadius: 20,
    alignItems: "center",
    gap: 5,
    padding: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  templates: {
    borderRadius: 20,
    alignItems: "center",
    padding: 5,
  },
  seeAll: {
    flexDirection: "row",
    borderRadius: 20,
    alignItems: "center",
    gap: 5,
    padding: 5,
    alignSelf: "flex-end",
  },
});

export default PromptComponent;
