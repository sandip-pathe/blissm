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

//TODO: add search functionality

const JournalDashboardScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const router = useRouter();
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

  return (
    <>
      <ScrollView contentContainerStyle={styles.journalList}>
        <View style={styles.container}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignContent: "center",
              gap: 5,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity style={styles.searchInput}>
              <TextInput
                placeholder="Search names, dates . . ."
                cursorColor={Colors.light}
                placeholderTextColor={Colors.light}
                style={{ flex: 1, fontSize: 18 }}
              />
              <MaterialCommunityIcons
                onPress={() =>
                  setViewMode(viewMode === "list" ? "grid" : "list")
                }
                name={viewMode === "list" ? "view-grid" : "view-agenda"}
                color={Colors.light}
                size={24}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: 10,
                paddingRight: 0,
                borderRadius: 25,
              }}
              onPress={() => {
                router.navigate(`/(modals)/settings`);
              }}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : journalEntries.length ? (
            viewMode === "list" ? (
              journalEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.journalItem}
                  onPress={() => router.navigate(`../(screens)/${entry.id}`)}
                >
                  <Text style={styles.journalDate}>{entry.id}</Text>
                  <Text style={styles.journalDate}>
                    {entry.lastBotResponse}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.gridContainer}>
                <View style={styles.column}>
                  {journalEntries
                    .filter((_, index) => index % 2 === 0)
                    .map((entry) => (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.gridItem}
                        onPress={() =>
                          router.navigate(`../(screens)/${entry.id}`)
                        }
                      >
                        <Text style={styles.journalDate}>{entry.id}</Text>
                        <Text style={styles.journalDate}>
                          {entry.lastBotResponse}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.column}>
                  {journalEntries
                    .filter((_, index) => index % 2 !== 0)
                    .map((entry) => (
                      <TouchableOpacity
                        key={entry.id}
                        style={styles.gridItem}
                        onPress={() =>
                          router.navigate(`../(screens)/${entry.id}`)
                        }
                      >
                        <Text style={styles.journalDate}>{entry.id}</Text>
                        <Text style={styles.journalDate}>
                          {entry.lastBotResponse}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )
          ) : (
            <Text style={styles.noEntriesText}>No journals found.</Text>
          )}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.writeEntryButton}
        onPress={() => {
          router.navigate(`../(screens)/new`);
        }}
      >
        <FontAwesome6 name="edit" size={20} color={Colors.dark} />
        <Text style={styles.buttonText}>Write Entry</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  journalList: {
    marginBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  streakRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    color: Colors.lightPink,
    fontWeight: "900",
    marginBottom: 20,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: Colors.darkLight,
    flex: 1,
  },
  writeEntryButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#E8F9FF",
  },
  buttonText: {
    color: Colors.dark,
    fontWeight: "500",
    textAlign: "center",
  },
  journalItem: {
    borderColor: Colors.primary,
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  journalDate: {
    fontSize: 16,
    color: Colors.light,
  },
  journalSummary: {
    color: Colors.greyLight,
    marginTop: 8,
  },
  viewButton: {
    marginTop: 10,
    backgroundColor: Colors.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  viewButtonText: {
    color: Colors.light,
    fontSize: 14,
  },
  noEntriesText: {
    color: Colors.light,
    fontSize: 16,
    textAlign: "center",
  },
  selectedJournalContainer: {
    backgroundColor: Colors.lightPink,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  selectedJournalDate: {
    fontSize: 18,
    color: Colors.light,
    fontWeight: "bold",
  },
  selectedJournalSummary: {
    color: Colors.greyLight,
    marginTop: 10,
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  column: {
    flex: 1,
    flexDirection: "column",
  },
  gridItem: {
    padding: 10,
    borderColor: Colors.primary,
    borderWidth: 1,
    marginVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
});

export default JournalDashboardScreen;
