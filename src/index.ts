export { buildImeLines } from "./build/build-map-lines.js";
export { buildImeWords } from "./build/build-words.js";
export { createFlatWords, createInitWordResults, getTotalNotes } from "./build/modules.js";

export { evaluateImeInput } from "./evaluete/evaluate-ime-input.js";
export { getTargetWords } from "./timer/get-target-words.js";

export type {
  BuiltImeLine,
  BuiltImeWord,
  Options,
  RawMapLine,
  UserResult,
  WordResult,
} from "./type.js";
