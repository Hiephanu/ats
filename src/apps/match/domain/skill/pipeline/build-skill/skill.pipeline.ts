import { PipelineStep } from "./type";

export class SkillPipeline<I, O> {
    private steps: PipelineStep<any, any>[];
  
    constructor(steps: PipelineStep<any, any>[]) {
      this.steps = steps;
    }
  
    async execute(input: I): Promise<O> {
      let current: any = input;
  
      for (const step of this.steps) {
        current = await step.process(current);
      }
  
      return current as O;
    }
}