import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "../../constants/firebaseConf";
import {
  deleteChatSession,
  getAllChatSessions,
  togglePinChatItem,
} from "@/database/sqlite";
import Avatar from "@/components/Avatar";
import ChatOnboarding from "@/components/ChatOnboarding";
import BouncingDotsLoader from "@/components/BouncingDotsLoader";
import { useCustomAuth } from "@/components/authContext";
import { useNetwork } from "@/components/NetworkContext";
import { useTheme } from "@react-navigation/native";
import ActionModal from "../(modals)/actionModal";
import ConfirmationModal from "../(modals)/deleteModal";

interface onlineGPTs {
  id: string;
  title: string;
  description: string;
  imageURL: string;
}

interface localGPTs {
  local_id: number;
  id: string;
  title: string;
  image_url?: string;
  created_at: string;
  isPinned: boolean;
  lastMessage: string;
}

interface ChatAgentItemProps {
  item: any;
  layout: "list" | "grid";
  descriptionKey: "created_at" | "description";
  highlightTitle?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const ChatDashboardScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [onlineGPTs, setonlineGPTs] = useState<onlineGPTs[]>([]);
  const [localChats, setLocalChats] = useState<localGPTs[]>([]);
  const [filteredOnlineEntries, setFilteredOnlineEntries] = useState<
    onlineGPTs[]
  >([]);
  const [filteredLocalEntries, setFilteredLocalEntries] = useState<localGPTs[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOnline, setLoadingOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActions, setModalActions] = useState([]);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const router = useRouter();
  const db = useSQLiteContext();
  const { currentUser } = useCustomAuth();
  const { colors } = useTheme();
  const styles = themedStyles(colors);
  const isConnected = useNetwork();

  const fetchLocalModels = async () => {
    try {
      const chatSessions: localGPTs[] = await getAllChatSessions(db);
      setLocalChats(chatSessions);
    } catch (error) {
      console.error("Failed to load local chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLocalModels();
    }, [db, currentUser?.uid])
  );

  const refreshJournalSessions = async () => {
    fetchLocalModels();
  };

  const fetchOnlineModels = async () => {
    setLoadingOnline(true);
    try {
      const querySnapshot = await getDocs(
        collection(FIRESTORE_DB, "blissmates")
      );
      const models: onlineGPTs[] = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        imageURL: doc.data().imageURL,
      }));
      setonlineGPTs(models);
    } catch (error) {
      console.error("Error fetching GPT models: ", error);
    } finally {
      setLoadingOnline(false);
    }
  };

  useEffect(() => {
    fetchOnlineModels();
  }, []);

  useEffect(() => {
    if (!localChats || !onlineGPTs) return;

    const localUsedIds = new Set(localChats.map((chat) => chat.id));

    const validOnlineModels = onlineGPTs.filter(
      (model) => !localUsedIds.has(model.id)
    );

    const filteredLocal = localChats.filter(
      (entry) =>
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.created_at?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOnline = validOnlineModels.filter(
      (entry) =>
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredLocalEntries(filteredLocal);
    setFilteredOnlineEntries(filteredOnline);
  }, [searchQuery, onlineGPTs, localChats]);

  const sortChats = (chats: localGPTs[]) => {
    return [...chats].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  };

  useEffect(() => {
    setFilteredLocalEntries(sortChats(localChats));
  }, [localChats]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLocalModels(), fetchOnlineModels()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const ChatAgentItem: React.FC<ChatAgentItemProps> = ({
    item,
    layout,
    descriptionKey,
    highlightTitle = false,
    onPress,
    onLongPress,
  }) => {
    const containerStyle =
      layout === "list" ? styles.journalItem : styles.gridItem;
    const avatarSize = layout === "list" ? 50 : 70;
    return (
      <TouchableOpacity
        style={[containerStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {item.isPinned == 1 && (
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
        <View style={styles.iconContainer}>
          <Avatar
            title={item.title}
            imageUrl={item.imageURL}
            size={avatarSize}
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.roleText}>
            {highlightTitle ? highlightSearchTerm(item.title) : item.title}
          </Text>
          <Text style={styles.descriptionText}>{item[descriptionKey]}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItems = (
    items: any[],
    descriptionKey: "created_at" | "description",
    highlight: boolean
  ) => {
    return items.map((item) => (
      <ChatAgentItem
        key={item.id}
        item={item}
        layout="list"
        descriptionKey={descriptionKey}
        highlightTitle={highlight}
        onLongPress={() => openOptions(item)}
        onPress={() => router.navigate(`../(chat)/${item.id}`)}
      />
    ));
  };

  const renderGridItems = (
    items: any[],
    descriptionKey: "created_at" | "description"
  ) => {
    const column1 = items.filter((_, index) => index % 2 === 0);
    const column2 = items.filter((_, index) => index % 2 !== 0);
    return (
      <View style={styles.gridContainer}>
        <View style={styles.column}>
          {column1.map((item) => (
            <ChatAgentItem
              key={item.id}
              item={item}
              layout="grid"
              onLongPress={() => openOptions(item)}
              descriptionKey={descriptionKey}
              onPress={() => router.navigate(`../(chat)/${item.id}`)}
            />
          ))}
        </View>
        <View style={styles.column}>
          {column2.map((item) => (
            <ChatAgentItem
              key={item.id}
              item={item}
              layout="grid"
              onLongPress={() => openOptions(item)}
              descriptionKey={descriptionKey}
              onPress={() => router.navigate(`../(chat)/${item.id}`)}
            />
          ))}
        </View>
      </View>
    );
  };

  const openOptions = (entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);

    const isOnlineGPT = filteredOnlineEntries.some(
      (gpt) => gpt.id === entry.id
    );

    const actions = isOnlineGPT
      ? null
      : [
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

  const handlePinToggle = async (entry) => {
    try {
      await togglePinChatItem(db, entry.local_id, entry.isPinned);
      refreshJournalSessions();
      onClose();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDeleteEntry = async () => {
    try {
      if (selectedEntry) {
        await deleteChatSession(db, selectedEntry.local_id);
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

  const closeModal = () => {
    setDeleteModalVisible(false);
    setSelectedEntry(null);
  };

  const onClose = () => {
    setModalVisible(false);
    setSelectedEntry(null);
  };
  return (
    <>
      <ScrollView
        contentContainerStyle={styles.journalList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
            <MaterialCommunityIcons
              onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              name={viewMode === "list" ? "view-grid" : "view-agenda"}
              color={colors.text}
              size={24}
            />
            <TouchableOpacity
              onPress={() => router.navigate("../(settings)/settings")}
            >
              <Ionicons name="settings" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View>
            {isConnected === null ? (
              <BouncingDotsLoader />
            ) : !isConnected ? (
              <>
                <Text>No Internet.</Text>
                <Text>Check your connection</Text>
              </>
            ) : null}
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : filteredLocalEntries.length > 0 ? (
            viewMode === "list" ? (
              renderListItems(filteredLocalEntries, "created_at", true)
            ) : (
              renderGridItems(filteredLocalEntries, "created_at")
            )
          ) : (
            <View>
              <ChatOnboarding />
            </View>
          )}
          {loadingOnline ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              {filteredOnlineEntries.length > 0 && (
                <>
                  <Text style={styles.title}>
                    Find BlissMates to start conversations
                  </Text>
                  {viewMode === "list"
                    ? renderListItems(
                        filteredOnlineEntries,
                        "description",
                        true
                      )
                    : renderGridItems(filteredOnlineEntries, "description")}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <ActionModal
        visible={modalVisible}
        onClose={onClose}
        actions={modalActions}
      />
      <ConfirmationModal
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

const themedStyles = (colors) =>
  StyleSheet.create({
    journalList: {
      marginBottom: 20,
    },
    offlineContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
    },
    title: {
      color: colors.border,
      marginVertical: 10,
      fontFamily: "Poppins-Regular",
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
    journalItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      marginBottom: 10,
      borderRadius: 10,
      backgroundColor: colors.card,
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
      alignItems: "center",
      padding: 16,
      marginVertical: 5,
      borderRadius: 8,
      marginBottom: 10,
      gap: 10,
      backgroundColor: colors.card,
    },
    iconContainer: {
      marginRight: 16,
    },
    detailsContainer: {
      flex: 1,
    },
    roleText: {
      fontSize: 18,
      color: colors.text,
      fontFamily: "Poppins-Bold",
    },
    descriptionText: {
      fontSize: 14,
      color: colors.border,
      fontFamily: "Poppins-Regular",
    },
    notFoundText: {
      fontSize: 16,
      color: colors.text,
      marginVertical: 20,
      fontFamily: "Poppins-Regular",
    },
    highlight: {
      backgroundColor: colors.primary,
      fontFamily: "Poppins-Bold",
    },
  });

export default ChatDashboardScreen;
