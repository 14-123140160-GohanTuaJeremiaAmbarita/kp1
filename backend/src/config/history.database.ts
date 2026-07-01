import { HistoryRepository } from "../repositories/history.repository";

export class HistoryService {

    private repository = new HistoryRepository();

    async createConversation(title: string, model: string) {

        return this.repository.createConversation(title, model);

    }

    async saveUserMessage(

        conversationId: string,

        message: string,

        model: string

    ) {

        return this.repository.saveMessage(

            conversationId,

            "user",

            message,

            undefined,

            model

        );

    }

    async saveAssistantMessage(

        conversationId: string,

        answer: string,

        sqlQuery?: string,

        model?: string

    ) {

        return this.repository.saveMessage(

            conversationId,

            "assistant",

            answer,

            sqlQuery,

            model

        );

    }

    async getHistory(conversationId: string) {

        return this.repository.getMessages(conversationId);

    }

    async getConversationList() {

        return this.repository.getConversationList();

    }

    async deleteConversation(id: string) {

        return this.repository.deleteConversation(id);

    }

}