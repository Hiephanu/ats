import { PipelineStep } from "../type";
import * as fileUtil from '@/libs/utils/procress-file';

export class CvReadStep implements PipelineStep<string, string> {
    async process(filePath: string): Promise<string> {
        return fileUtil.parseText(filePath);
    }
}