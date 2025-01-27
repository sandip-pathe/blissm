import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";

const DateComponent: React.FC = () => {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <TouchableOpacity
      onPress={() => setShowPicker(true)}
      style={styles.container}
    ></TouchableOpacity>
  );
};

export default DateComponent;

const styles = StyleSheet.create({
  container: {
    color: Colors.light,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
  },
  text: { color: Colors.light, fontWeight: "400", fontSize: 16 },
});
