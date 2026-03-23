import * as fileUtil from '@/libs/utils/procress-file';
import { PipelineStep } from '../type';

export class CvReadStep implements PipelineStep<string, string> {
    async process(filePath: string): Promise<string> {
        return fileUtil.parseText(filePath);
    }
}