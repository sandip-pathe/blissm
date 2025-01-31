//TODO: UI Color scheme

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Colors from "@/constants/Colors";
import { getAlljournalSession } from "@/database/sqlite"; // Custom database functions
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

const JournalDashboardScreen: React.FC = () => {
  const db = useSQLiteContext();
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const entries = await getAlljournalSession(db);
        setJournalEntries(entries);
      } catch (error) {
        console.error("Failed to load journal entries:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const filtered = journalEntries.filter(
      (entry) =>
        entry.lastBotResponse &&
        entry.lastBotResponse.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [searchQuery, journalEntries]);

  const highlightSearchTerm = (text: string) => {
    if (!searchQuery) return text;

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <Text key={index} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + " . . ."; // Add ellipsis if text exceeds maxLength
    }
    return text;
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.journalList}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search names, dates . . ."
              placeholderTextColor={Colors.light}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <MaterialCommunityIcons
              onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              name={viewMode === "list" ? "view-grid" : "view-agenda"}
              color={Colors.light}
              size={24}
            />
            <TouchableOpacity
              onPress={() => router.navigate("/(modals)/settings")}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : filteredEntries.length ? (
            viewMode === "list" ? (
              filteredEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.journalItem}
                  onPress={() => router.navigate(`../(screens)/${entry.id}`)}
                >
                  <Text style={styles.journalDate}>
                    {highlightSearchTerm(
                      truncateText(entry.lastBotResponse, 100)
                    )}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.gridContainer}>
                {filteredEntries.map((entry, index) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.gridItem}
                    onPress={() => router.navigate(`../(screens)/${entry.id}`)}
                  >
                    <Text style={styles.journalDate}>
                      {highlightSearchTerm(
                        truncateText(entry.lastBotResponse, 100)
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : (
            <Text style={styles.noEntriesText}>No journals found.</Text>
          )}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.writeEntryButton}
        onPress={() => router.navigate("../(screens)/new")}
      >
        <FontAwesome6 name="edit" size={20} color={Colors.dark} />
        <Text style={styles.buttonText}>Write Entry</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  journalList: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.darkLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.light,
    paddingVertical: 10,
  },
  writeEntryButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#E8F9FF",
  },
  buttonText: {
    color: Colors.dark,
    fontWeight: "500",
  },
  journalItem: {
    backgroundColor: Colors.darkLight,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  journalDate: {
    fontSize: 16,
    color: Colors.light,
  },
  noEntriesText: {
    textAlign: "center",
    color: Colors.light,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: Colors.darkLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  highlight: {
    backgroundColor: Colors.primary,
    color: "white",
    fontWeight: "bold",
  },
});

export default JournalDashboardScreen;
