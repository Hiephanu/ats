import 'dotenv/config';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

class GeminiClient {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor() {
        console.log("cwd =", process.cwd());
        console.log("GEMINI =", process.env.GEMINI_API_KEY);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("❌ Thiếu GEMINI_API_KEY trong file .env");
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });
    }

    async generateJSON<T>(prompt: string): Promise<T> {
        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const response = result.response;
            const text = response.text();

            return JSON.parse(text) as T;
        } catch (error: any) {
            console.error("Error to fetch data", error.message);
            throw error;
        }
    }
}

const instance = new GeminiClient();
Object.freeze(instance);

export default instance;