import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const COLORS = [
  "#FF6B6B",
  "#F7B801",
  "#6A0572",
  "#1FAB89",
  "#4B6DFF",
  "#B69EFE",
  "#FFA37F",
];

const getInitials = (title?: string): string => {
  if (!title) return "NA"; // Default initials
  const words = title.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : words[0][0].toUpperCase();
};

const getColorFromText = (text: string) => {
  const hash = text
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length]; // Consistent color selection
};

const Avatar = ({
  title,
  imageUrl,
  size = 50,
}: {
  title?: string;
  imageUrl?: string;
  size?: number;
}) => {
  const initials = getInitials(title);
  const backgroundColor = getColorFromText(initials);

  return imageUrl ? (
    <Image
      source={{ uri: imageUrl }}
      style={[styles.image, { width: size, height: size }]}
    />
  ) : (
    <View
      style={[
        styles.container,
        { backgroundColor, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: size / 2 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontFamily: "Poppins-Bold",
  },
  image: {
    borderRadius: 50,
    resizeMode: "cover",
  },
});

export default Avatar;
