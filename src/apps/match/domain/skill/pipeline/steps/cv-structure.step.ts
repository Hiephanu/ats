import instance from "@/libs/gemini.client";
import { PipelineStep, CvStructured } from "../type";

export class CvStructureStep implements PipelineStep<string, CvStructured> {
  constructor() {}

  async process(rawText: string): Promise<CvStructured> {
    return await instance.generateJSON(rawText);
  }
}