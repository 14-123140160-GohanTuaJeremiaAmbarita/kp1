import sql from "mssql";
import { getConnection } from "../config/history.database";
import {
    Conversation,
    Message,
} from "../types/history";

export class HistoryRepository {

    async getConversations(): Promise<Conversation[]> {

        const db = await getConnection();

        const result = await db.request().query(`
            SELECT *
            FROM AI_Conversation
            ORDER BY UpdatedAt DESC
        `);

        return result.recordset;
    }

    async getConversationById(id: string) {

        const db = await getConnection();

        const conversation = await db
            .request()
            .input("id", sql.UniqueIdentifier, id)
            .query(`
                SELECT *
                FROM AI_Conversation
                WHERE ConversationId=@id
            `);

        const messages = await db
            .request()
            .input("id", sql.UniqueIdentifier, id)
            .query(`
                SELECT *
                FROM AI_Message
                WHERE ConversationId=@id
                ORDER BY CreatedAt
            `);

        return {
            conversation: conversation.recordset[0],
            messages: messages.recordset,
        };
    }

    async createConversation(
        title: string,
        model: string
    ) {

        const db = await getConnection();

        const result = await db
            .request()
            .input("title", sql.NVarChar, title)
            .input("model", sql.NVarChar, model)
            .query(`
            INSERT INTO AI_Conversation
            (
                Title,
                Model
            )

            OUTPUT INSERTED.*

            VALUES
            (
                @title,
                @model
            )
        `);

        return result.recordset[0];
    }

    async addMessage(
        conversationId: string,
        role: string,
        content: string,
        sqlQuery?: string,
        model?: string
    ) {

        const db = await getConnection();

        const result = await db
            .request()
            .input(
                "conversationId",
                sql.UniqueIdentifier,
                conversationId
            )
            .input("role", sql.NVarChar, role)
            .input("content", sql.NVarChar(sql.MAX), content)
            .input("sqlQuery", sql.NVarChar(sql.MAX), sqlQuery ?? null)
            .input("model", sql.NVarChar, model ?? null)

            .query(`
            INSERT INTO AI_Message
            (
                ConversationId,
                Role,
                Content,
                SqlQuery,
                Model
            )

            OUTPUT INSERTED.*

            VALUES
            (
                @conversationId,
                @role,
                @content,
                @sqlQuery,
                @model
            )
        `);

        await db
            .request()
            .input(
                "conversationId",
                sql.UniqueIdentifier,
                conversationId
            )
            .query(`
                UPDATE AI_Conversation
                SET UpdatedAt=GETDATE()
                WHERE ConversationId=@conversationId
            `);

        return result.recordset[0];
    }

    async renameConversation(
        id: string,
        title: string
    ) {

        const db = await getConnection();

        await db.request()

            .input("id", sql.UniqueIdentifier, id)

            .input("title", sql.NVarChar, title)

            .query(`
                UPDATE AI_Conversation

                SET
                    Title=@title,
                    UpdatedAt=GETDATE()

                WHERE ConversationId=@id
            `);
    }

    async deleteConversation(id: string) {

        const db = await getConnection();

        await db.request()

            .input("id", sql.UniqueIdentifier, id)

            .query(`
                DELETE
                FROM AI_Conversation
                WHERE ConversationId=@id
            `);
    }
}

export default new HistoryRepository();