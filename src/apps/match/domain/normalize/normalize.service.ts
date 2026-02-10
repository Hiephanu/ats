// apps/match/services/cv.service.ts
import instance from '../';

// Định nghĩa Interface để quản lý dữ liệu chặt chẽ (Best Practice)
export interface ParsedCV {
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string[];
  }[];
}

export const processCV = async (rawText: string): Promise<ParsedCV> => {
    // Chuyển Prompt thành dạng chuyên nghiệp hơn
    const prompt = `
        Role: Senior ATS Architect & Data Engineer.
        Task: Extract and normalize structured data from raw CV text.
        
        Constraints:
        1. Accuracy: Do not hallucinate. Maintain original detail in 'description'.
        2. Clean: Fix character sticking or encoding issues from PDF parsing.
        3. Skills: Extract granular skills (e.g., 'React.js', 'PostgreSQL' instead of just 'Web Dev').
        4. Language: Keep original language for professional terms.

        Schema: Return data matching the following TypeScript interface:
        {
          fullName: string,
          email: string,
          phone: string,
          skills: string[],
          experience: Array<{ company: string, role: string, duration: string, description: string[] }>
        }

        Input Raw Text:
        ---
        ${rawText}
        ---
    `;

    try {
        // Sử dụng phương thức generateJSON của Gemini
        const jsonResult = await instance.generateJSON<ParsedCV>(prompt);
        return jsonResult;
    } catch (error) {
        console.error("❌ Lỗi khi parse CV với Gemini:", error);
        throw new Error("Lỗi xử lý AI: Không thể trích xuất thông tin CV.");
    }
};