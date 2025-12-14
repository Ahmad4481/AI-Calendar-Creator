import TimedCache from "../cache.js";
import Repository from "../Repository.js";
import { serverTimestamp } from "../firebase-exports.js";

export default class ConversationService {
    constructor() {
        this.collection = "users/conversations";

        this.cache = new TimedCache(60000);

        this.repo = new Repository(this.collection);
    }

   
    async getConversations(userId) {
        const key = `${userId}:conversations`;

        return this.cache.remember(key, async () => {
            return this.repo.find(userId, (ref) => ref); // get all
        });
    }

   
    async createConversation(userId, { title = "New Chat" } = {}) {
        const ref = await this.repo.add(userId, {
            title,
            createdAt: serverTimestamp(),
            messages: []
        });

        // مسح الكاش حتى يحمل الجديد
        this.cache.delete(`${userId}:conversations`);

        return { id: ref.id, ...ref.data() };
    }

    
    async getMessages(userId, conversationId) {
        const key = `${userId}:${conversationId}:messages`;

        return this.cache.remember(key, async () => {
            const doc = await this.repo.get(userId, conversationId);
            return doc?.messages || [];
        });
    }

   
    async addMessage(userId, conversationId, { role, content }) {
        const messages = await this.getMessages(userId, conversationId);

        const newMessage = {
            id: crypto.randomUUID(),
            role,
            content,
            createdAt: serverTimestamp()
        };

        const updated = [...messages, newMessage];

        await this.repo.update(userId, conversationId, {
            messages: updated
        });

        // تحديث الكاش
        this.cache.set(`${userId}:${conversationId}:messages`, updated);

        return newMessage;
    }

   
    async updateMessage(userId, conversationId, messageId, data) {
        const messages = await this.getMessages(userId, conversationId);

        const index = messages.findIndex(m => m.id === messageId);
        if (index === -1) return null;

        messages[index] = { ...messages[index], ...data };

        await this.repo.update(userId, conversationId, { messages });

        this.cache.set(`${userId}:${conversationId}:messages`, messages);

        return messages[index];
    }

    async deleteConversation(userId, conversationId) {
        await this.repo.delete(userId, conversationId);

        this.cache.delete(`${userId}:conversations`);
        this.cache.delete(`${userId}:${conversationId}:messages`);
    }

    async updateConversation(userId, conversationId, data) {
        await this.repo.update(userId, conversationId, data);

        this.cache.delete(`${userId}:conversations`);
    }
}
