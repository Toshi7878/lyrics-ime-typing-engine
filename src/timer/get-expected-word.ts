import { BuiltImeWord } from "../type";

export const getExpectedWords = (count: number, words: BuiltImeWord[]) => {
  return words.slice(0, count).flat(1);
};
