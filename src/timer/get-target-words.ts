import type { BuiltImeWord } from "../type";

export const getTargetWords = (count: number, words: BuiltImeWord[]) => {
  return words.slice(0, count).flat(1);
};
