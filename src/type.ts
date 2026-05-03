export interface RawMapLine<TOptions = unknown> {
  time: string | number;
  lyrics: string;
  word: string;
  options?: TOptions;
}

export type BuiltImeLine = {
  startTime: number;
  word: string;
  endTime: number;
}[];

export type BuiltImeWord = string[][][];

export type WordResult = {
  inputs: string[];
  evaluation: "Great" | "Good" | "Skip" | "None";
};

export type Options = {
  minLineDuration?: number;
  isCaseSensitive: boolean;
  includeRegexPattern: string;
  enableIncludeRegex: boolean;
};

export type UserResult = { name: string; typeCount: number; wordResults: WordResult[]; currentWordIndex: number };

