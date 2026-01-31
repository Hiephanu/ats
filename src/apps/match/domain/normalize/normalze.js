import { parseText } from "../pdf.service";

const step1_ExtractAndSegment = async (filePath) => {
    const pdfData = await parseText(filePath);

}