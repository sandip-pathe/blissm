import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import {
  deleteJournalSession,
  getAlljournalSession,
  togglePinJournalSession,
} from "@/database/sqlite";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import JournalOnboarding from "@/components/journalOnboarding";
import { posthog } from "@/constants/posthogConfig";
import { useCustomAuth } from "@/components/authContext";
import ActionModal from "../(modals)/actionModal";
import { useTheme } from "@react-navigation/native";
import AlertModal from "../(modals)/deleteModal";
import { useColorScheme } from "@/hooks/useColorScheme";

const index: React.FC = () => {
  const db = useSQLiteContext();
  const router = useRouter();
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const { currentUser } = useCustomAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActions, setModalActions] = useState([]);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const colorScheme = useColorScheme();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      let entries = await getAlljournalSession(db);
      entries.sort((a, b) => b.isPinned - a.isPinned);
      setJournalEntries(entries);
      console.log("Entries:", entries);
    } catch (error) {
      console.error("Failed to load journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      posthog.identify(currentUser?.email);
      fetchEntries();
    }, [db, currentUser?.uid])
  );

  const refreshJournalSessions = async () => {
    fetchEntries();
  };

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
      return text.slice(0, maxLength) + " . . .";
    }
    return text;
  };

  const openOptions = (entry) => {
    setSelectedEntry(entry);
    console.log(entry);
    setModalVisible(true);

    const actions = [
      {
        text: entry.isPinned ? "Unpin" : "Pin",
        onPress: () => handlePinToggle(entry),
        icon: entry.isPinned ? (
          <AntDesign name="pushpino" color={colors.text} />
        ) : (
          <AntDesign name="pushpin" color={colors.text} />
        ),
      },
      {
        text: "Delete",
        onPress: () => confirmDeleteMessage(),
        icon: <MaterialCommunityIcons name="delete" color={colors.text} />,
      },
    ];
    setModalActions(actions);
  };

  const closeModal = () => {
    setDeleteModalVisible(false);
    setSelectedEntry(null);
  };

  const onClose = () => {
    setModalVisible(false);
    setSelectedEntry(null);
  };

  const handlePinToggle = async (entry) => {
    try {
      await togglePinJournalSession(db, entry.id, entry.isPinned);
      refreshJournalSessions();
      onClose();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDeleteEntry = async () => {
    try {
      if (selectedEntry) {
        await deleteJournalSession(db, selectedEntry.id);
        refreshJournalSessions();
        closeModal();
      }
    } catch (error) {
      console.error("Failed to delete journal session:", error);
    }
  };

  const confirmDeleteMessage = () => {
    setModalVisible(false);
    setDeleteModalVisible(true);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.journalList}>
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search names, dates . . ."
              placeholderTextColor={colors.border}
              style={styles.searchInput}
              value={searchQuery}
              cursorColor={colors.text}
              onChangeText={setSearchQuery}
            />
            {!loading && filteredEntries.length !== 0 ? (
              <MaterialCommunityIcons
                onPress={() =>
                  setViewMode(viewMode === "list" ? "grid" : "list")
                }
                name={viewMode === "list" ? "view-grid" : "view-agenda"}
                color={colors.text}
                size={24}
              />
            ) : null}
            <TouchableOpacity
              onPress={() => router.navigate("../(settings)/settings")}
            >
              <Ionicons name="settings" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : filteredEntries.length ? (
            viewMode === "list" ? (
              filteredEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.journalItem,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? entry.dark : entry.light,
                    },
                    selectedEntry?.id === entry.id && {
                      borderColor: colors.text,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => router.navigate(`../(screens)/${entry.id}`)}
                  onLongPress={() => openOptions(entry)}
                >
                  {entry.isPinned == 1 && (
                    <AntDesign
                      name="pushpin"
                      size={18}
                      color={colors.text}
                      style={{
                        flex: 1,
                        position: "absolute",
                        top: 10,
                        right: 10,
                      }}
                    />
                  )}
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
                    style={[
                      styles.gridItem,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? entry.dark : entry.light,
                      },
                      selectedEntry?.id === entry.id && {
                        borderColor: colors.text,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => router.navigate(`../(screens)/${entry.id}`)}
                    onLongPress={() => openOptions(entry)}
                  >
                    {entry.isPinned == 1 && (
                      <AntDesign
                        name="pushpin"
                        size={18}
                        color={colors.border}
                        style={{
                          flex: 1,
                          position: "absolute",
                          top: 10,
                          right: 10,
                        }}
                      />
                    )}
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
            <View style={{ flex: 1, justifyContent: "center" }}>
              <JournalOnboarding />
            </View>
          )}
        </View>
      </ScrollView>
      {!loading && filteredEntries.length !== 0 ? (
        <TouchableOpacity
          style={styles.writeEntryButton}
          onPress={() => router.navigate("../(screens)/new")}
        >
          <MaterialCommunityIcons
            name="note-plus"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      ) : null}
      <ActionModal
        visible={modalVisible}
        onClose={onClose}
        actions={modalActions}
      />
      <AlertModal
        visible={isDeleteModalVisible}
        title="Delete Entry"
        message="Are you sure you want to delete this journal entry?"
        onCancel={closeModal}
        onConfirm={handleDeleteEntry}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

export default index;
const themedStyles = (colors) =>
  StyleSheet.create({
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
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 10,
      marginBottom: 20,
      marginTop: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 18,
      color: colors.text,
      paddingVertical: 10,
      fontFamily: "Poppins-Regular",
    },
    writeEntryButton: {
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      bottom: 16,
      right: 16,
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 50,
      elevation: 5,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    buttonText: {
      color: colors.text,
      fontWeight: "500",
    },
    journalItem: {
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
    },
    journalDate: {
      fontSize: 18,
      color: colors.text,
      fontFamily: "Poppins-Regular",
    },
    noEntriesText: {
      textAlign: "center",
      color: colors.text,
      fontSize: 16,
      fontFamily: "Poppins-Regular",
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    gridItem: {
      width: "48%",
      padding: 10,
      borderRadius: 8,
      marginBottom: 10,
    },
    highlight: {
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
  });
