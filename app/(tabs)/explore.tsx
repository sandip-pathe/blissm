import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import Colors from "@/constants/Colors";
import {
  AntDesign,
  Feather,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { TextInput } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "@/FirebaseConfig";
import { getAllChatSessions, inspectDatabase } from "@/database/sqlite";

interface onlineGPTs {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
}

interface localGPTs {
  id: string;
  title: string;
  icon?: string;
  image?: string;
  created_at: any;
  is_pinned: boolean;
}

const ChatDashboardScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [gptModels, setGptModels] = useState<onlineGPTs[]>([]);
  const [localChats, setLocalChats] = useState<localGPTs[]>([]);
  const router = useRouter();
  const db = useSQLiteContext();

  useEffect(() => {
    const fetchGptModels = async () => {
      try {
        const chatSessions: localGPTs[] = await getAllChatSessions(db);
        setLocalChats(chatSessions);
      } catch (error) {
        console.error("Failed to load local chat sessions:", error);
      }
      try {
        const querySnapshot = await getDocs(
          collection(FIRESTORE_DB, "personas")
        );
        const models: onlineGPTs[] = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description,
          icon: doc.data().icon,
          image: doc.data().image,
        }));
        setGptModels(models);
      } catch (error) {
        console.error("Error fetching GPT models: ", error);
      }
    };
    fetchGptModels();
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
                router.navigate(`/(modals)/promptsModal`);
              }}
            >
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {localChats.length ? (
            viewMode === "list" ? (
              localChats.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.journalItem}
                  onPress={() => router.navigate(`../(chat)/${e.id}`)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="chatbox" size={40} color={Colors.light} />
                  </View>
                  <View style={styles.detailsContainer}>
                    <Text style={styles.roleText}>{e.title}</Text>
                    <Text style={styles.descriptionText}>{e.created_at}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.gridContainer}>
                <View style={styles.column}>
                  {localChats
                    .filter((_, index) => index % 2 === 0)
                    .map((e) => (
                      <TouchableOpacity
                        key={e.id}
                        style={styles.gridItem}
                        onPress={() => router.navigate(`../(chat)/${e.id}`)}
                      >
                        <View style={styles.iconContainer}>
                          <Ionicons
                            name="chatbox"
                            size={50}
                            color={Colors.light}
                          />
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.roleText}>{e.title}</Text>
                          <Text style={styles.descriptionText}>
                            {e.created_at}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.column}>
                  {localChats
                    .filter((_, index) => index % 2 !== 0)
                    .map((e) => (
                      <TouchableOpacity
                        key={e.id}
                        style={styles.gridItem}
                        onPress={() => router.navigate(`../(chat)/${e.id}`)}
                      >
                        <View style={styles.iconContainer}>
                          <Ionicons
                            name="chatbox"
                            size={50}
                            color={Colors.light}
                          />
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.roleText}>{e.title}</Text>
                          <Text style={styles.descriptionText}>
                            {e.created_at}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )
          ) : (
            <View style={styles.offlineContainer}>
              <Text style={styles.title}>
                No Chats, find your bot from list of specialized chatbots!
              </Text>
            </View>
          )}
          {gptModels.length > 0 && (
            <View style={styles.offlineContainer}>
              <Text style={styles.title}>Explore more</Text>
            </View>
          )}
          {gptModels.length ? (
            viewMode === "list" ? (
              gptModels.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.journalItem}
                  onPress={() => router.navigate(`../(chat)/${e.id}`)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={e.icon as any}
                      size={40}
                      color={Colors.light}
                    />
                  </View>
                  <View style={styles.detailsContainer}>
                    <Text style={styles.roleText}>{e.title}</Text>
                    <Text style={styles.descriptionText}>{e.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.gridContainer}>
                <View style={styles.column}>
                  {gptModels
                    .filter((_, index) => index % 2 === 0)
                    .map((e) => (
                      <TouchableOpacity
                        key={e.id}
                        style={styles.gridItem}
                        onPress={() => router.navigate(`../(chat)/${e.id}`)}
                      >
                        <View style={styles.iconContainer}>
                          <Ionicons
                            name={e.icon as any}
                            size={50}
                            color={Colors.light}
                          />
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.roleText}>{e.title}</Text>
                          <Text style={styles.descriptionText}>
                            {e.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.column}>
                  {gptModels
                    .filter((_, index) => index % 2 !== 0)
                    .map((e) => (
                      <TouchableOpacity
                        key={e.id}
                        style={styles.gridItem}
                        onPress={() => router.navigate(`../(chat)/${e.id}`)}
                      >
                        <View style={styles.iconContainer}>
                          <Ionicons
                            name={e.icon as any}
                            size={50}
                            color={Colors.light}
                          />
                        </View>
                        <View style={styles.detailsContainer}>
                          <Text style={styles.roleText}>{e.title}</Text>
                          <Text style={styles.descriptionText}>
                            {e.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )
          ) : (
            <View style={styles.offlineContainer}>
              <MaterialIcons
                name="wifi-off"
                size={80}
                color={Colors.lightPink}
              />
              <Text style={styles.title}>Oops! You're Offline</Text>
              <Text style={styles.subtext}>
                Looks like your internet took a break, but your old chatbots are
                still here to hang out!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light,
    marginTop: 10,
  },
  subtext: {
    fontSize: 16,
    textAlign: "center",
    color: "#606060",
    marginVertical: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: Colors.darkLight,
    flex: 1,
  },
  journalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
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
    color: Colors.pink,
    fontSize: 30,
    fontWeight: "bold",
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
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.primary,
    marginVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  iconContainer: {
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
  },
  roleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.greyLight,
  },
});

export default ChatDashboardScreen;
