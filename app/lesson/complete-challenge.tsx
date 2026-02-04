"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  words: { 
    id: number; 
    word: string; 
    order: number;
    correct: boolean;
  }[]; 
  onComplete: () => void; 
  disabled?: boolean; 
  question: string;
}

const WordOption = ({ word, onClick, disabled, isSelected }: { 
  word: string; 
  onClick: () => void; 
  disabled?: boolean;
  isSelected?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isSelected}
    className={cn(
      "text-sm sm:text-base md:text-lg font-medium px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all transform",
      "shadow-sm hover:shadow-md active:scale-95",
      "bg-gradient-to-br from-emerald-50 to-white",
      isSelected && "opacity-50 cursor-not-allowed bg-gray-50",
      disabled 
        ? "opacity-50 cursor-not-allowed border-gray-200" 
        : "border-emerald-200 cursor-pointer hover:border-emerald-300 hover:from-emerald-100 hover:to-emerald-50",
      "border-2"
    )}
  >
    {word}
  </button>
);

export const CompleteChallenge = ({
  words,
  onComplete,
  disabled,
  question
}: Props) => {
  const [availableWords, setAvailableWords] = useState([...words]);
  const [selectedWords, setSelectedWords] = useState<typeof words>([]);
  const requiredWords = question.split('_____').length - 1; // Count number of blanks
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleWordClick = (word: typeof words[0]) => {
    if (disabled || selectedWords.length >= requiredWords) return;
    
    setAvailableWords(prev => prev.filter(w => w.id !== word.id));
    setSelectedWords(prev => [...prev, word]);
    setIsCorrect(null);
  };

  const handleSelectedWordClick = (word: typeof words[0]) => {
    if (disabled) return;
    
    setSelectedWords(prev => prev.filter(w => w.id !== word.id));
    setAvailableWords(prev => [...prev, word]);
    setIsCorrect(null);
  };

  const checkAnswer = () => {
    const isAnswerCorrect = selectedWords.length === requiredWords && 
      selectedWords.every((word, index) => word.correct && word.order === index + 1);

    setIsCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      onComplete();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col items-center space-y-4 sm:space-y-6 flex-grow w-full max-w-5xl mx-auto">
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          {/* Question with blanks */}
          <div className="text-base sm:text-lg md:text-xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-white to-emerald-50 rounded-xl sm:rounded-2xl shadow-xl border border-emerald-100">
            <div className="space-y-8 leading-relaxed tracking-wide">
            {question.split('_____').map((part, index, array) => (
              <React.Fragment key={index}>
                <span className="text-gray-800 leading-loose">{part.trim()}</span>
                {index < array.length - 1 && (
                  <>
                    {' '}
                    {selectedWords[index] ? (
                      <span 
                        onClick={() => handleSelectedWordClick(selectedWords[index])}
                        className={cn(
                          "px-4 py-2 rounded-xl bg-emerald-100 cursor-pointer",
                          "hover:bg-emerald-200 transition-all transform hover:scale-105",
                          "border-2 border-emerald-200 hover:border-emerald-300",
                          "font-medium text-emerald-800 mx-2",
                          disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                        )}
                      >
                        {selectedWords[index].word}
                      </span>
                    ) : (
                      <span className="px-4 py-2 mx-2 my-2 text-emerald-800/50 border-b-2 border-emerald-200 inline-block min-w-[100px] text-center align-middle">
                        _____
                      </span>
                    )}
                    {' '}
                  </>
                )}
              </React.Fragment>
            ))}
            </div>
          </div>

          {/* Available words */}
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white shadow-lg border border-emerald-100">
            <div className="w-full text-center mb-2 text-sm text-emerald-600 font-medium">
              Choose the correct words:
            </div>
            {availableWords.map((word) => (
              <WordOption
                key={word.id}
                word={word.word}
                onClick={() => handleWordClick(word)}
                disabled={disabled || selectedWords.length >= requiredWords}
                isSelected={selectedWords.some(w => w.id === word.id)}
              />
            ))}
          </div>
        </div>

        {isCorrect !== null && (
          <div className={cn(
            "mt-4 sm:mt-6 md:mt-8 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-center text-base sm:text-lg md:text-xl font-semibold",
            "transform transition-all duration-300 animate-fade-in",
            "shadow-lg border-2",
            isCorrect 
              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300" 
              : "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300"
          )}>
            <div className="flex items-center justify-center gap-3">
              {isCorrect ? (
                <>
                  <span className="text-2xl">🎉</span>
                  <span>Excellent work! You got it right!</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">💪</span>
                  <span>Keep trying, you&apos;re getting closer!</span>
                </>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={checkAnswer}
          disabled={disabled || selectedWords.length !== requiredWords}
          size="lg"
          className={cn(
            "mt-4 sm:mt-6 md:mt-8 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl text-base sm:text-lg font-medium transition-all transform",
            "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
            "hover:from-emerald-600 hover:to-green-600 hover:scale-105",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            "shadow-lg hover:shadow-xl"
          )}
        >
          {selectedWords.length === requiredWords ? "Check Answer" : `Select ${requiredWords - selectedWords.length} more word${selectedWords.length === requiredWords - 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
};
