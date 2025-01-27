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
            system_instructions TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            summary_id INTEGER,
            is_pinned BOOLEAN DEFAULT 0,
            FOREIGN KEY(summary_id) REFERENCES summary(id)
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
            is_archieved BOOLEAN DEFAULT 0,
            is_pinned BOOLEAN DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS journalContentsTable (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            journal_id INTEGER NOT NULL,
            user_prompt TEXT,
            bot_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_edited BOOLEAN DEFAULT 0,
            deleted_at DATETIME,
            reactions TEXT,
            CONSTRAINT fk_journal FOREIGN KEY (journal_id) REFERENCES journalSessionsTable(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS journalSummaries (
            id INTEGER PRIMARY KEY NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

export const addJournalSession = async (
  db: SQLiteDatabase, 
  name: string
): Promise<number | undefined> => {
  try {
    const result = await db.runAsync(
      `INSERT INTO journalSessionsTable (name) VALUES (?)`,
      [name]
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


export const getJournalById = async (db: SQLiteDatabase, journalId: number ) => {
  try {
    const sessionResult: any = await db.getFirstAsync(
      `SELECT id, name, created_at FROM journalSessionsTable WHERE id = ?`,
      [journalId]
    );

    if (!sessionResult) {
      throw new Error(`Journal session with ID ${journalId} not found.`);
    }

    const contentsResult = await db.getAllAsync(
      `SELECT user_prompt, bot_response, created_at, is_edited, reactions
       FROM journalContentsTable WHERE journal_id = ? ORDER BY created_at ASC`,
      [journalId]
    );

    return {
      id: sessionResult.id,
      name: sessionResult.name,
      createdAt: sessionResult.created_at,
      inputs: contentsResult.map((content: any) => content.user_prompt),
      prompts: contentsResult.map((content: any) => content.bot_response),
      contents: contentsResult,
    };
  } catch (error) {
    console.error("Failed to fetch journal by ID:", error);
    throw error; 
  }
};


export const addJournalContent = async (
  db: SQLiteDatabase,
  journalId: number,
  userPrompt: string,
  botResponse: string,
) => {
  try {
    await db.runAsync(
      `INSERT INTO journalContentsTable 
      (journal_id, user_prompt, bot_response) 
      VALUES (?, ?, ?)`,
      [
        journalId,
        userPrompt,
        botResponse,
      ]
    );
  } catch (error) {
    console.error("Failed to add journal content:", error);
  }
};


export const addInitialPromptJournalContent = async (
  db: SQLiteDatabase,
  journalId: number,
  userPrompt: string,
  botResponse: string,
) => {
  try {
    await db.runAsync(
      `INSERT INTO journalContentsTable 
      (journal_id,user_prompt, bot_response) 
      VALUES (?, ?, ?)`,
      [
        journalId,
        userPrompt,
        botResponse,
      ]
    );
  } catch (error) {
    console.error("Failed to add Initial Bot Prompt:", error);
  }
};

export const getAlljournalSession = async (db: SQLiteDatabase) => {
  try {
    const query = `
      SELECT 
        js.id, 
        js.name, 
        js.created_at, 
        jc.bot_response
      FROM 
        journalSessionsTable js
      LEFT JOIN (
        SELECT 
          journal_id, 
          bot_response
        FROM 
          journalContentsTable 
        WHERE 
          id IN (
            SELECT MAX(id) 
            FROM journalContentsTable 
            GROUP BY journal_id
          )
      ) jc ON js.id = jc.journal_id
      ORDER BY js.created_at DESC;
    `;

    const result = await db.getAllAsync(query);
    return result.map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      date: entry.created_at,
      lastBotResponse: entry.bot_response,
    }));
  } catch (error) {
    console.log("No Journals available", error);
    return [];
  }
};

export const getLastTwoJournalExchanges = async (db: SQLiteDatabase) => {
  try {
    // Query the last two exchanges from SQLite
    const result = await db.getAllAsync(
      `SELECT user_prompt, bot_response 
       FROM journalContentsTable 
       ORDER BY id DESC 
       LIMIT 2`
      
      //add condition when journalId == journalId
    );

    // Convert results to OpenAI-compatible message objects
    const history = result
      .reverse()
      .flatMap((exchange: any) => [
        { role: "user", content: exchange.user_prompt},
        { role: "assistant", content: exchange.bot_response},
      ]);
    return history; 
  } catch (error) {
    console.error("Failed to fetch last two exchanges:", error);
    return []; // Return an empty array if something fails
  }
};

export const addJournalSummary = async (db: SQLiteDatabase, content: string) => {
  try {
    await db.runAsync(
      "INSERT INTO journalSummaries (content) VALUES (?)",[content]
    );
  } catch (error) {
    console.error("Failed to add journalSummaries:", error);
  }
};

export const getJournalSummary = async (db: SQLiteDatabase): Promise<string> => {
  try {
    const result: { content?: string }| null | undefined = await db.getFirstAsync(
      "SELECT content FROM journalSummaries ORDER BY id DESC LIMIT 1"
    );
    return result?.content || '';
  } catch (error) {
    console.error("Failed to fetch journalSummaries:", error);
    return '';
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

export const clearAllData = async (db: SQLiteDatabase): Promise<void> => {
  try {
    // Enable foreign key constraints to respect cascade delete
    await db.execAsync("PRAGMA foreign_keys = ON;");

    const tables = [
      'chatSessions',
      'journalSummaries',
      'chatHistorys',
      'journalSessionsTable',
      'journalContentsTable'
    ];

    for (const table of tables) {
      // Clear all data
      await db.runAsync(`DELETE FROM ${table}`);
      console.log(`Cleared all entries from ${table}`);
      
      // Reset autoincrement counter
      await db.runAsync("DELETE FROM sqlite_sequence WHERE name = ?", [table]);
      console.log(`Reset autoincrement counter for ${table}`);
    }

    console.log("All data cleared, autoincrement reset, and cascade delete enabled.");
  } catch (error) {
    console.error("Failed to clear data and reset counters:", error);
  }
};

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
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
  botResponse: string,
) => {
  try {
    await db.runAsync(
      `INSERT INTO chatHistorys 
      (chat_id, user_prompt, bot_response) 
      VALUES (?, ?, ?)`,
      [
        sessionId,
        userPrompt,
        botResponse,
      ]
    );
  } catch (error) {
    console.error("Failed to add chat history:", error);
  }
};

export const getChatById = async (db: SQLiteDatabase, chatId: number) => {
  try {
    const session = await db.getFirstAsync<ChatSession>(
      `SELECT * FROM chatSessions WHERE id = ?`,
      [chatId]
    );

    if (!session) return null;

    const messages = await db.getAllAsync<ChatMessage>(
      `SELECT * FROM chatHistorys 
       WHERE chat_id = ? 
       ORDER BY created_at ASC`,
      [chatId]
    );

    const summary = await db.getFirstAsync<{ content: string }>(
      `SELECT content FROM summary 
       WHERE id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [session.summary_id!]
    );

    return {
      ...session,
      messages,
      summary: summary?.content || '',
    };
  } catch (error) {
    console.error("Failed to fetch chat session:", error);
    return null;
  }
};

export const getLastTwoExchanges = async (db: SQLiteDatabase, chatId: number) => {
  try {
    const result = await db.getAllAsync(
      `SELECT user_prompt, bot_response 
       FROM chatHistorys 
       WHERE chat_id = ?
       ORDER BY id DESC 
       LIMIT 2`,
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
      `SELECT 
        id, 
        persona_id, 
        title, 
        created_at, 
        is_pinned 
       FROM chatSessions 
       ORDER BY created_at DESC`
    );

    return result.map((entry: any) => ({
      local_id: entry.id,
      id: entry.persona_id,
      title: entry.title,
      created_at: entry.created_at,
      is_pinned: entry.is_pinned === 1 // Convert to boolean
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
          columns: columns.map(col => ({
            name: col.name,
            type: col.type,
            primaryKey: col.pk === 1,
            nullable: col.notnull === 0,
            defaultValue: col.dflt_value
          }))
        };
      })
    );

    console.log('Database Schema:');
    console.log(JSON.stringify(schema, null, 2));
    
    return schema;
  } catch (error) {
    console.error('Database inspection failed:', error);
    throw error;
  }
}