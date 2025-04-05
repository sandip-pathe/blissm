import { SQLiteDatabase } from "expo-sqlite";
import * as FileSystem from "expo-file-system";

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  console.log("Document Directory:", FileSystem.documentDirectory);
  // await db.execAsync(`PRAGMA user_version = 0;`);

  const DATABASE_VERSION = 2;
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentDbVersion = result?.user_version ?? 0;

  console.log("Current DB Version:", currentDbVersion);

  if (currentDbVersion >= DATABASE_VERSION) {
    console.log("ALREADY ON LATEST DB");
    return;
  }

  // Migration process
  console.log("Starting Database Migration...");
  try {
    if (currentDbVersion === 0) {
      await db.execAsync(`
        PRAGMA journal_mode = 'wal';

        CREATE TABLE IF NOT EXISTS chatSessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            persona_id TEXT NOT NULL UNIQUE,
            system_instructions TEXT,
            summary_instructions TEXT,
            title TEXT NOT NULL,
            summary TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_pinned BOOLEAN DEFAULT 0,
            image_url TEXT,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS chatHistorys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            user_prompt TEXT NOT NULL,
            bot_response TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_edited BOOLEAN DEFAULT 0,
            deleted_at DATETIME,
            reactions TEXT,
            FOREIGN KEY(chat_id) REFERENCES chatSessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS journalSessionsTable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            summary TEXT DEFAULT '',
            is_archived BOOLEAN DEFAULT 0,
            is_pinned BOOLEAN DEFAULT 0,
            background_color TEXT DEFAULT '#000000',
            background_light TEXT DEFAULT '#ffffff',
            tags TEXT,
            description TEXT,
            summary_instructions TEXT,
            journal_instructions TEXT
        );


        CREATE TABLE IF NOT EXISTS journalContentsTable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            journal_id INTEGER NOT NULL,
            uuid TEXT NOT NULL,
            content TEXT NOT NULL,
            role INTEGER NOT NULL,
            edited INTEGER DEFAULT 0,
            is_deleted BOOLEAN DEFAULT 0,
            reactions TEXT,
            CONSTRAINT fk_journal FOREIGN KEY (journal_id) REFERENCES journalSessionsTable(id) ON DELETE CASCADE
        );

        PRAGMA user_version = ${DATABASE_VERSION};
      `);

      console.log("Database tables created successfully.");
    } else {
      console.log("No migrations required.");
    }
  } catch (error) {
    console.error("Database migration failed:", error);
  }

  // Confirm version update
  const updatedVersion = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  console.log("Updated DB Version:", updatedVersion?.user_version);
}

export const getJournalById = async (db: SQLiteDatabase, journalId: number) => {
  try {
    const sessionResult: any = await db.getFirstAsync(
      `SELECT id, name, background_color, background_light, created_at, summary, is_archived, is_pinned FROM journalSessionsTable WHERE id = ?`,
      [journalId]
    );

    if (!sessionResult) {
      throw new Error(`Journal session with ID ${journalId} not found.`);
    }

    const contentsResult = await db.getAllAsync(
      `SELECT uuid, content, role, edited, is_deleted, reactions
       FROM journalContentsTable
       WHERE journal_id = ? AND is_deleted = 0
       ORDER BY uuid ASC`,
      [journalId]
    );

    return {
      id: sessionResult.id,
      name: sessionResult.name,
      dark: sessionResult.background_color,
      light: sessionResult.background_light,
      createdAt: sessionResult.created_at,
      summary: sessionResult.summary,
      isArchived: sessionResult.is_archived,
      isPinned: sessionResult.is_pinned,
      messages: contentsResult.map((content: any) => ({
        uuid: content.uuid,
        text: content.content,
        role: content.role,
        edited: content.is_edited,
        reactions: content.reactions,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch journal by ID:", error);
    throw error;
  }
};

export const backgroundColorUpdate = async (
  db: SQLiteDatabase,
  journalId: number,
  darkColor: string,
  lightColor: string
) => {
  try {
    await db.runAsync(
      `UPDATE journalSessionsTable SET background_color = ?, background_light = ? WHERE id = ?`,
      [darkColor, lightColor, journalId]
    );
  } catch (error) {
    console.error("Failed to update background color:", error);
  }
};

export const addJournalSession = async (
  db: SQLiteDatabase,
  name: string,
  journalInstructions: string,
  summaryInstructions: string,
  darkColor: string,
  lightColor: string
): Promise<number | undefined> => {
  try {
    const result = await db.runAsync(
      `INSERT INTO journalSessionsTable (name, journal_instructions, summary_instructions, background_color, background_light) VALUES (?, ?, ?, ?, ?)`,
      [name, journalInstructions, summaryInstructions, darkColor, lightColor]
    );

    if (result && result.lastInsertRowId !== undefined) {
      return result.lastInsertRowId;
    } else {
      console.error("Unexpected result format:", result);
      return undefined;
    }
  } catch (error) {
    console.error("Failed to add journal session:", error);
    return undefined;
  }
};

export const addJournalContent = async (
  db: SQLiteDatabase,
  journalId: number,
  uuid: string,
  content: string,
  role: number,
  edited?: number,
  reactions?: string
) => {
  try {
    await db.runAsync(
      `INSERT INTO journalContentsTable (journal_id, uuid, content, role, edited, reactions) VALUES (?, ?, ?, ?, ?, ?)`,
      [journalId, uuid, content, role, edited, reactions]
    );
  } catch (error) {
    console.error("Failed to add journal content:", error);
  }
};

export const getAlljournalSession = async (db: SQLiteDatabase) => {
  try {
    await db.runAsync(`
      DELETE FROM journalSessionsTable
      WHERE id IN (
        SELECT journal_id FROM journalContentsTable GROUP BY journal_id HAVING COUNT(*) = 1
      );
    `);

    await db.runAsync(`
      DELETE FROM journalContentsTable
      WHERE journal_id NOT IN (SELECT id FROM journalSessionsTable);
    `);

    const query = `
      SELECT
        js.id,
        js.name,
        js.created_at,
        js.background_color,
        js.background_light,
        js.is_archived,
        js.is_pinned,
        jc.content
      FROM
        journalSessionsTable js
      LEFT JOIN (
        SELECT
          journal_id,
          content
        FROM
          journalContentsTable
        WHERE
          id IN (
            SELECT MAX(id)
            FROM journalContentsTable
            GROUP BY journal_id
          )
      ) jc ON js.id = jc.journal_id
      ORDER BY js.created_at DESC, js.id DESC;
    `;

    const result = await db.getAllAsync(query);
    return result.map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      date: entry.created_at,
      lastBotResponse: entry.content,
      dark: entry.background_color,
      light: entry.background_light,
      isArchived: entry.is_archived,
      isPinned: entry.is_pinned,
    }));
  } catch (error) {
    console.log("Error fetching journals:", error);
    return [];
  }
};

export const getLastTwoJournalExchanges = async (
  db: SQLiteDatabase,
  journalId: number
) => {
  try {
    const result = await db.getAllAsync(
      `SELECT content, role 
       FROM journalContentsTable 
       WHERE journal_id = ? AND is_deleted = 0
       ORDER BY id DESC 
       LIMIT 4`,
      [journalId]
    );

    const history = result.reverse().map((entry: any) => ({
      role: entry.role === 0 ? "assistant" : "user",
      content: entry.content,
    }));

    return history;
  } catch (error) {
    console.error("Failed to fetch last two exchanges:", error);
    return []; // Return an empty array if something fails
  }
};

export const addJournalSummary = async (
  db: SQLiteDatabase,
  content: string,
  id: number
) => {
  try {
    await db.runAsync(
      `UPDATE journalSessionsTable SET summary = ? WHERE id = ?`,
      [content, id]
    );
  } catch (error) {
    console.error("Failed to add journalSummaries:", error);
  }
};

export const getJournalSummaryByDate = async (db: any, date: any) => {
  try {
    const result = await db.getFirstAsync(
      `SELECT content FROM journalSummaries 
       WHERE DATE(created_at) = DATE(?) 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [date]
    );

    return result ? result.content : "No summary available for this date.";
  } catch (error) {
    console.error("Failed to fetch journal summary for date:", error);
    return "Error fetching summary.";
  }
};

const tableExists = async (
  db: SQLiteDatabase,
  tableName: string
): Promise<boolean> => {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
  );
  return (result?.count ?? 0) > 0;
};

export const clearAllData = async (db: SQLiteDatabase): Promise<void> => {
  try {
    await db.execAsync("PRAGMA foreign_keys = ON;");

    const tables = [
      "chatSessions",
      "journalSummaries",
      "chatHistorys",
      "journalSessionsTable",
      "journalContentsTable",
    ];

    for (const table of tables) {
      if (await tableExists(db, table)) {
        await db.runAsync(`DELETE FROM ${table}`);
        await db.runAsync("DELETE FROM sqlite_sequence WHERE name = ?", [
          table,
        ]);
        console.log(`Cleared and reset ${table}`);
      } else {
        console.warn(`Table ${table} does not exist, skipping.`);
      }
    }

    console.log("All data cleared and counters reset.");
  } catch (error) {
    console.error("Failed to clear data and reset counters:", error);
  }
};

export const deleteTableData = async (
  db: SQLiteDatabase,
  tableName: string
) => {
  try {
    await db.runAsync(`DELETE FROM ${tableName}`);
    await db.runAsync("DELETE FROM sqlite_sequence WHERE name = ?", [
      tableName,
    ]);
    console.log(`✅ All entries from '${tableName}' deleted.`);
  } catch (error) {
    console.error(`❌ Failed to delete entries from '${tableName}':`, error);
  }
};

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  summary: string;
  summary_id?: number;
  is_pinned: boolean;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  user_prompt: string;
  bot_response: string;
  created_at: string;
}

export const addChat = async (
  db: SQLiteDatabase,
  sessionId: number,
  userPrompt: string,
  botResponse: string
) => {
  try {
    await db.runAsync(
      `INSERT INTO chatHistorys 
      (chat_id, user_prompt, bot_response) 
      VALUES (?, ?, ?)`,
      [sessionId, userPrompt, botResponse]
    );
  } catch (error) {
    console.error("Failed to add chat history:", error);
  }
};

export const getChatById = async (
  db: SQLiteDatabase,
  chatId: number,
  limit: number = 10
) => {
  try {
    const session = await db.getFirstAsync<ChatSession>(
      `SELECT * FROM chatSessions WHERE id = ?`,
      [chatId]
    );

    if (!session) return null;

    const messages = await db.getAllAsync<ChatMessage>(
      `SELECT * FROM chatHistorys 
       WHERE chat_id = ? 
       ORDER BY id DESC 
       LIMIT ?`,
      [chatId, limit]
    );

    return {
      ...session,
      messages,
      summary: session.summary || "",
    };
  } catch (error) {
    console.error("Failed to fetch chat session:", error);
    return null;
  }
};

export const getLastTwoExchanges = async (
  db: SQLiteDatabase,
  chatId: number
) => {
  try {
    const result = await db.getAllAsync(
      `SELECT user_prompt, bot_response 
       FROM chatHistorys 
       WHERE chat_id = ?
       ORDER BY id DESC 
       LIMIT 5`,
      [chatId]
    );

    return result.reverse().flatMap((exchange: any) => [
      { role: "user", content: exchange.user_prompt },
      { role: "assistant", content: exchange.bot_response },
    ]);
  } catch (error) {
    console.error("Failed to fetch last two exchanges:", error);
    return [];
  }
};

export const updateChatSummary = async (
  db: SQLiteDatabase,
  sessionId: number,
  content: string
) => {
  try {
    await db.runAsync(
      `UPDATE chatSessions 
       SET summary = ?, last_updated = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [content, sessionId]
    );
  } catch (error) {
    console.error("Failed to update summary:", error);
  }
};

export const getAllChatSessions = async (db: SQLiteDatabase) => {
  try {
    const result = await db.getAllAsync(
      `SELECT cs.id, cs.persona_id, cs.title, cs.created_at, cs.is_pinned, cs.image_url, lm.bot_response
       FROM chatSessions cs
       LEFT JOIN (
         SELECT chat_id, MAX(created_at) AS last_message_time, bot_response
         FROM chatHistorys
         GROUP BY chat_id
       ) lm ON cs.id = lm.chat_id
       WHERE lm.bot_response IS NOT NULL  -- Skip sessions with no messages
       ORDER BY cs.created_at DESC`
    );

    return result.map((entry: any) => ({
      local_id: entry.id,
      id: entry.persona_id,
      title: entry.title,
      created_at: entry.created_at,
      isPinned: entry.is_pinned,
      imageURL: entry.image_url,
      lastMessage: entry.bot_response,
    }));
  } catch (error) {
    console.log("No chat sessions available", error);
    return [];
  }
};

export async function inspectDatabase(db: SQLiteDatabase) {
  try {
    const tables = await db.getAllAsync<{ name: string; sql: string }>(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    const schema = await Promise.all(
      tables.map(async (table) => {
        const columns = await db.getAllAsync<{
          cid: number;
          name: string;
          type: string;
          notnull: 0 | 1;
          dflt_value: any;
          pk: 0 | 1;
        }>(`PRAGMA table_info(${table.name})`);

        return {
          table: table.name,
          sql: table.sql,
          columns: columns.map((col) => ({
            name: col.name,
            type: col.type,
            primaryKey: col.pk === 1,
            nullable: col.notnull === 0,
            defaultValue: col.dflt_value,
          })),
        };
      })
    );

    console.log("Database Schema:");
    console.log(JSON.stringify(schema, null, 2));

    return schema;
  } catch (error) {
    console.error("Database inspection failed:", error);
    throw error;
  }
}

export const deleteJournalContent = async (
  db: SQLiteDatabase,
  messageId: string
) => {
  try {
    await db.runAsync(`DELETE FROM journalContentsTable WHERE uuid = ?`, [
      messageId,
    ]);
    console.log(`Message ID ${messageId} deleted permanently.`);
    return true;
  } catch (error) {
    console.error("Failed to delete journal content:", error);
    return false;
  }
};

export const deleteJournalSession = async (
  db: SQLiteDatabase,
  journalId: number
) => {
  try {
    await db.runAsync(`DELETE FROM journalSessionsTable WHERE id = ?`, [
      journalId,
    ]);
    console.log(`Journal Session ID ${journalId} deleted permanently.`);
    return true;
  } catch (error) {
    console.error("Failed to delete journal session:", error);
    return false;
  }
};

export const deleteChatSession = async (db: SQLiteDatabase, chatId: number) => {
  try {
    await db.runAsync(`DELETE FROM chatSessions WHERE id = ?`, [chatId]);
    console.log(`Chat Session ID ${chatId} deleted permanently.`);
    return true;
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return false;
  }
};

export const deleteChatItem = async (db: SQLiteDatabase, messageId: number) => {
  try {
    await db.runAsync(`DELETE FROM chatHistorys WHERE id = ?`, [messageId]);
    console.log(`Chat Item ID ${messageId} deleted permanently.`);
    return true;
  } catch (error) {
    console.error("Failed to delete chat item:", error);
    return false;
  }
};

// PIN/UNPIN FUNCTIONS

export const togglePinJournalSession = async (
  db: SQLiteDatabase,
  journalId: number,
  isPinned: boolean
) => {
  try {
    await db.runAsync(
      `UPDATE journalSessionsTable SET is_pinned = ? WHERE id = ?`,
      [isPinned ? 0 : 1, journalId]
    );
    console.log(
      `Journal Session ID ${journalId} ${
        isPinned ? "unpinned" : "pinned"
      } successfully.`
    );
    return true;
  } catch (error) {
    console.error("Failed to toggle pin for journal session:", error);
    return false;
  }
};

export const togglePinChatItem = async (
  db: SQLiteDatabase,
  sessionId: number,
  isPinned: boolean
) => {
  try {
    console.log(`togglePinChatItem: `, sessionId, isPinned);
    await db.runAsync(`UPDATE chatSessions SET is_pinned = ? WHERE id = ?`, [
      isPinned ? 0 : 1,
      sessionId,
    ]);

    console.log(
      `Chat Item ID ${sessionId} ${
        isPinned ? "unpinned" : "pinned"
      } successfully.`
    );
    return true;
  } catch (error) {
    console.error("Failed to toggle pin for chat item:", error);
    return false;
  }
};

export const editJournalContent = async (
  db: SQLiteDatabase,
  uuid: string,
  newContent: string
) => {
  try {
    await db.runAsync(
      `UPDATE journalContentsTable SET content = ?, edited = edited + 1 WHERE uuid = ?`,
      [newContent, uuid]
    );
  } catch (error) {
    console.error("Failed to edit journal content:", error);
  }
};
