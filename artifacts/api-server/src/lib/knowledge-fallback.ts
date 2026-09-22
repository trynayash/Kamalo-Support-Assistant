import type { RetrievedArticle } from "./knowledge";
import { selectGroundedAnswer } from "./intent-grounding";

/** Grounded customer answer when the LLM provider is unavailable. */
export function knowledgeBackedFallback(options: {
  question: string;
  groundedFact: string | null;
  retrieved: RetrievedArticle[];
}): string | null {
  return selectGroundedAnswer(options.question, options.retrieved, options.groundedFact);
}
