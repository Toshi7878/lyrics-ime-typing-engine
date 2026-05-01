import { normalizeTypingText } from "../normalize-word";
import type { Options, WordResult } from "../type";
import { kanaToHira } from "../utils/string";

type EvaluateInputResult = {
  wordResultUpdates: Array<{ index: number; result: WordResult }>;
  nextWordIndex?: number;
  typeCountDelta: number;
  typeCountStatsDelta: number;
  notificationsToAppend: string[];
};

export const evaluateImeInput = (
  input: string,
  typingWord: {
    targetWords: string[][][];
    currentWordIndex: number;
  },
  wordResults: WordResult[],
  map: { flatWords: string[] },
  options: Omit<Options, "minLineDuration">,
): EvaluateInputResult => {
  let remainingInput = normalizeInputText(input, options);
  const wordResultUpdates: EvaluateInputResult["wordResultUpdates"] = [];
  const notificationsToAppend: string[] = [];
  let nextWordIndex: number | undefined;
  let typeCountDelta = 0;
  let typeCountStatsDelta = 0;

  const { currentWordIndex, targetWords } = typingWord;
  if (currentWordIndex >= map.flatWords.length) {
    return {
      wordResultUpdates,
      nextWordIndex,
      typeCountDelta,
      typeCountStatsDelta,
      notificationsToAppend,
    };
  }

  for (const [i, targetWord] of targetWords.entries()) {
    if (i < currentWordIndex) continue;
    if (!remainingInput) break;

    const correct = evaluateInputAgainstTarget(remainingInput, targetWord);

    if (correct.evaluation === "None") {
      const prevEvaluation = wordResults[i - 1]?.evaluation;
      const isPrevFailure = prevEvaluation === "None" || prevEvaluation === "Skip";
      const currentResult = wordResults[i];
      if (!currentResult) continue;

      const result: WordResult = isPrevFailure
        ? { inputs: [], evaluation: "Skip" as const }
        : { inputs: [...currentResult.inputs, remainingInput], evaluation: "None" as const };

      wordResultUpdates.push({ index: i, result });
      wordResults[i] = result;
      continue;
    }

    const prevResultEntry = [...wordResults.entries()]
      .reverse()
      .find(([index, result]) => i > index && result.evaluation !== "Skip");
    const [prevIndex, prevResult] = prevResultEntry ?? [];

    if (prevIndex !== undefined && prevResult?.evaluation === "None") {
      const fixedText = getBeforeTarget(prevResult.inputs[prevResult.inputs.length - 1] ?? "", correct.correcting);
      const result: WordResult = {
        evaluation: "None",
        inputs: [...prevResult.inputs.slice(0, -1), fixedText].filter((v) => v !== ""),
      };
      wordResultUpdates.push({ index: prevIndex, result });
      wordResults[prevIndex] = result;
    }

    const lyricsIndex = remainingInput.indexOf(correct.correcting);
    remainingInput = remainingInput.slice(lyricsIndex + correct.correcting.length);

    {
      const result: WordResult = { inputs: [correct.correcting], evaluation: correct.evaluation };
      wordResultUpdates.push({ index: i, result });
      wordResults[i] = result;
    }

    const joinedJudgeWord = targetWord.map((chars) => chars[0]).join("");
    const isGood = correct.evaluation === "Good";
    const wordTypeCount = joinedJudgeWord.length / (isGood ? 1.5 : 1);

    nextWordIndex = i + 1;
    typeCountDelta += wordTypeCount;
    typeCountStatsDelta += Math.round(wordTypeCount);
    notificationsToAppend.push(`${i}: ${correct.evaluation}! ${correct.correcting}`);
  }

  return {
    wordResultUpdates,
    nextWordIndex,
    typeCountDelta,
    typeCountStatsDelta,
    notificationsToAppend,
  };
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& はマッチした部分文字列を示します
}

function evaluateInputAgainstTarget(input: string, targetWords: string[][]) {
  let evaluation: "Great" | "Good" = "Great";
  let correcting = "";
  let reSearchFlag = false;

  let remainingInput = input;

  for (const [i, judgedWord] of targetWords.entries()) {
    for (const [m, target] of judgedWord.entries()) {
      let search = remainingInput.search(escapeRegExp(target));

      // Great判定
      if (m === 0) {
        if (i === 0 && search > 0) {
          remainingInput = remainingInput.slice(search);
          search = 0;
        }
        if (search === 0) {
          correcting += target;
          remainingInput = remainingInput.slice(target.length);
          break;
        }
      }

      if (search > 0 && correcting) {
        reSearchFlag = true;
      }

      // 最後の候補でGood/None判定
      if (m === judgedWord.length - 1) {
        const commentHira = kanaToHira(remainingInput.toLowerCase());
        const targetHira = kanaToHira(target.toLowerCase());
        let replSearch = commentHira.search(escapeRegExp(targetHira));

        if (i === 0 && replSearch > 0) {
          remainingInput = remainingInput.slice(replSearch);
          replSearch = 0;
        }

        if (replSearch > 0 && i && correcting) {
          reSearchFlag = true;
        }

        if (replSearch === 0) {
          correcting += remainingInput.slice(0, target.length);
          remainingInput = remainingInput.slice(target.length);
          evaluation = "Good";
          break;
        }

        if (reSearchFlag) {
          // 再帰的に再判定
          return evaluateInputAgainstTarget(remainingInput, targetWords);
        }

        return { correcting, evaluation: "None" as const, currentComment: remainingInput };
      }
    }
  }

  return { correcting, evaluation, currentComment: remainingInput };
}

const normalizeInputText = (text: string, options: Omit<Options, "minLineDuration">) => {
  let normalizedText = text;

  normalizedText = normalizeTypingText(normalizedText, options);

  //全角の前後のスペースを削除
  normalizedText = normalizedText.replace(/(\s+)([^!-~])/g, "$2").replace(/([^!-~])(\s+)/g, "$1");

  //テキストの末尾が半角ならば末尾に半角スペース追加
  if (/[!-~]$/.test(normalizedText)) {
    normalizedText = normalizedText + " ";
  }
  return normalizedText;
};

function getBeforeTarget(str: string, target: string): string {
  const index = str.indexOf(target);
  return index !== -1 ? str.slice(0, index) : "";
}
