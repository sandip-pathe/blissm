import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ChatInterface } from "@/components/ChatInterface";

const HomeScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <ChatInterface />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
