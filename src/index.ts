export { buildImeLines } from "./build/build-map-lines";
export { buildImeWords } from "./build/build-words";
export { createFlatWords, createInitWordResults, getTotalNotes } from "./build/modules";

export { evaluateImeInput } from "./evaluete/evaluate-ime-input";
export { getExpectedWords } from "./timer/get-expected-word";

export type {
  BuiltImeLine,
  BuiltImeWord,
  Options,
  RawMapLine,
  WordResult,
} from "./type";
