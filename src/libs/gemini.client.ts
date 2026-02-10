import 'dotenv/config';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

class GeminiClient {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("❌ Thiếu GEMINI_API_KEY trong file .env");
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        // Lưu ý: Đảm bảo model name chính xác với phiên bản bạn được cấp quyền
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" 
        });
        
        console.log("✨ Đã khởi tạo Gemini Client (Singleton)");
    }

    /**
     * @template T Kiểu dữ liệu mong muốn trả về
     * @param prompt Câu lệnh gửi cho AI
     */
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
            
            // Ép kiểu dữ liệu trả về theo Type T đã truyền vào
            return JSON.parse(text) as T;
        } catch (error: any) {
            console.error("❌ Lỗi Gemini API:", error.message);
            throw error;
        }
    }
}

// Khởi tạo Singleton
const instance = new GeminiClient();
Object.freeze(instance);

export default instance;