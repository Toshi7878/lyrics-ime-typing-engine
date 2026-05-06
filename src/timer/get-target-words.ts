import type { BuiltImeWord } from "../type.js";

export const getTargetWords = (count: number, words: BuiltImeWord[]) => {
  return words.slice(0, count).flat(1);
};
