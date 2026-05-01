import { normalizeTypingText } from "../normalize-word";
import type { BuiltImeLine, Options, RawMapLine } from "../type";
import { zip } from "../utils/array";

export const buildImeLines = async (mapData: RawMapLine[], options: Options) => {
  const { minLineDuration = 5 } = options;
  let lineWords: string[] = [];
  let lineTimes: number[] = [];
  const lines: BuiltImeLine[] = [];

  for (const [i, currentLine] of mapData.entries()) {
    const nextLine = mapData[i + 1];
    const nextToNextLine = mapData[i + 2];

    const normalizedTypingLyrics = normalizeTypingText(deleteRubyTag(currentLine.lyrics), options);

    const isTypingLine = isValidTypingLine(normalizedTypingLyrics, currentLine.word);

    if (isTypingLine) {
      lineWords.push(normalizedTypingLyrics);
      lineTimes.push(Number(currentLine.time));
    }

    const shouldBreakLine = shouldCreateNewLine(
      lineWords,
      minLineDuration,
      nextLine,
      getNextTime(nextLine, nextToNextLine),
      lineTimes,
    );

    if (shouldBreakLine) {
      const lastTime = nextLine ? Number(nextLine.time) : Number(currentLine.time) + 10; // 次の行がない場合は10秒後

      const WordsWithTimes = zip<number, string>(lineTimes, lineWords).map(([time, word], index) => {
        const nextTime = lineTimes[index + 1];

        return {
          startTime: time,
          word,
          endTime: nextTime ? nextTime : lastTime,
        };
      });

      lines.push(WordsWithTimes);

      lineWords = [];
      lineTimes = [];
    }
  }

  return lines;
};

const isValidTypingLine = (formattedLyrics: string, word: string): boolean => {
  return formattedLyrics !== "" && formattedLyrics !== "end" && word.replace(/\s/g, "") !== "";
};

const getNextTime = (nextLine: RawMapLine | undefined, lineAfterNext: RawMapLine | undefined): number => {
  if (!nextLine) return 0;

  return lineAfterNext && nextLine.word.replace(/\s/g, "") === "" ? Number(lineAfterNext.time) : Number(nextLine.time);
};

const shouldCreateNewLine = (
  lineChars: string[],
  minLineDuration: number,
  nextLine: RawMapLine | undefined,
  nextTime: number,
  lineTimes: number[],
): boolean => {
  return lineChars.length > 0 && (!nextLine || minLineDuration < nextTime - (lineTimes?.[0] ?? 0));
};

const deleteRubyTag = (text: string) => {
  const rubyMatches = text.match(/<*ruby(?: .+?)?>.*?<.*?\/ruby*>/g);
  if (!rubyMatches) return text;

  let result = text;
  for (const rubyTag of rubyMatches) {
    const start = rubyTag.indexOf(">") + 1;
    const end = rubyTag.indexOf("<rt>");
    const rubyText = rubyTag.slice(start, end);
    result = result.replace(rubyTag, rubyText);
  }

  return result;
};
