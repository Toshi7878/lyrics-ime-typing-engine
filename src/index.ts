export { buildImeLines } from "./build/build-map-lines";
export { buildImeWords } from "./build/build-words";
export { createFlatWords, createInitWordResults, getTotalNotes } from "./build/modules";

export { evaluateImeInput } from "./evaluete/evaluate-ime-input";
export { getTargetWords } from "./timer/get-target-words";

export type {
  BuiltImeLine,
  BuiltImeWord,
  Options,
  RawMapLine,
  WordResult,
} from "./type";
