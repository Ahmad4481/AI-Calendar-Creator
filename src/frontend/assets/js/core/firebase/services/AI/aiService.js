// aiService.js
import { getFunctions, httpsCallable } from "../../firebase-exports.js";
import { app } from "../../config.js";

export default class AiService {
  constructor() {
    this.functions = getFunctions(app);
    this.useAiFunction = httpsCallable(this.functions, "useAi");
  }

  async callAi(payload) {
    try {
      const result = await this.useAiFunction(payload);
      return result.data;
    } catch (error) {
      console.error("[AiService] callAi error:", error);
      throw error;
    }
  }
}
