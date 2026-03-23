import { SkillPipeline } from "./skill.pipeline";
import { CvReadStep } from "./steps/cv-read.step";
import { CvStructureStep } from "./steps/cv-structure.step";
import { CvStructured } from "./type";

const pipeline = new SkillPipeline<string, CvStructured>([
    new CvReadStep(),
    new CvStructureStep()
]);
  
const result = await pipeline.execute("./cv.pdf");