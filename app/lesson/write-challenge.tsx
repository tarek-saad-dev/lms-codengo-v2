"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Function to calculate string similarity (Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  
  // Convert distance to similarity score (0-1)
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - track[str2.length][str1.length] / maxLength;
}

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

export const WriteChallenge = ({
  words,
  onComplete,
  disabled,
  question
}: Props) => {
  const [answers, setAnswers] = useState<string[]>(Array(question.split('_____').length - 1).fill(''));
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const similarityThreshold = 0.8; // 80% similarity is considered correct

  const handleInputChange = (value: string, index: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    setIsCorrect(null);
  };

  const checkAnswer = () => {
    const correctWords = words.filter(w => w.correct)
      .sort((a, b) => a.order - b.order)
      .map(w => w.word.toLowerCase());

    const userAnswers = answers.map(a => a.trim().toLowerCase());
    
    // Check each answer against all correct words with spell tolerance
    const isAnswerCorrect = userAnswers.every((answer, index) => {
      const correctWord = correctWords[index];
      const similarity = calculateSimilarity(answer, correctWord);
      return similarity >= similarityThreshold;
    });

    setIsCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      onComplete();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col items-center space-y-4 sm:space-y-6 flex-grow w-full max-w-5xl mx-auto">
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
          {/* Question with input fields */}
          <div className="text-base sm:text-lg md:text-xl p-4 sm:p-6 md:p-8 bg-gradient-to-br from-white to-emerald-50 rounded-xl sm:rounded-2xl shadow-xl border border-emerald-100">
            <div className="space-y-8 leading-relaxed tracking-wide">
              {question.split('_____').map((part, index, array) => (
                <React.Fragment key={index}>
                  <span className="text-gray-800">{part.trim()}</span>
                  {index < array.length - 1 && (
                    <Input
                      value={answers[index]}
                      onChange={(e) => handleInputChange(e.target.value, index)}
                      disabled={disabled}
                      className={cn(
                        "inline-block w-32 sm:w-40 mx-2 text-center",
                        "border-b-2 border-emerald-200 focus:border-emerald-400",
                        "bg-transparent focus:ring-0 focus:outline-none",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                      placeholder="Type answer..."
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
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
          disabled={disabled || answers.some(a => !a.trim())}
          size="lg"
          className={cn(
            "mt-4 sm:mt-6 md:mt-8 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl text-base sm:text-lg font-medium transition-all transform",
            "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
            "hover:from-emerald-600 hover:to-green-600 hover:scale-105",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            "shadow-lg hover:shadow-xl"
          )}
        >
          Check Answer
        </Button>
      </div>
    </div>
  );
};
