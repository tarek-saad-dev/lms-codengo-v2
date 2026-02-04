"use client";
import { FC } from 'react';

interface QuestionProps {
    question: {
        question: string;
        choice1: string;
        choice2: string;
        dimension: string;
    } | null;
    onAnswerClick: (answer: {
        dimension: string;
        value: number;
    }) => void;
}

const Question: FC<QuestionProps> = ({ question, onAnswerClick }) => {
    if (!question) return null;
    
    const [firstDimension, secondDimension] = question.dimension?.split('&') || [];
    
    const options = [
        { value: 1.0, label: `Strongly ${firstDimension}` },
        { value: 0.83, label: `${firstDimension}` },
        { value: 0.67, label: `Somewhat ${firstDimension}` },
        { value: 0.5, label: `Neutral` },
        { value: 0.33, label: `Somewhat ${secondDimension}` },
        { value: 0.17, label: `${secondDimension}` },
        { value: 0.0, label: `Strongly ${secondDimension}` }
    ];

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg shadow-emerald-100 transform transition-all duration-500 hover:shadow-2xl">
            <h1 className="text-lg mb-8 text-center font-bold bg-gradient-to-r from-emerald-500 to-purple-500 bg-clip-text text-transparent">
                {question.question}
            </h1>
            <div className="flex justify-between mb-8">
                <span className="text-emerald-600 font-semibold text-xs px-4 mx-4 py-2 bg-emerald-100 rounded-se-lg shadow-md transform transition hover:scale-105">
                    {question.choice1}
                </span>
                <span className="text-purple-600 font-semibold text-xs px-4 mx-4 py-2 bg-purple-100 rounded-se-lg shadow-md transform transition hover:scale-105">
                    {question.choice2}
                </span>
            </div>
            <div className="flex justify-between gap-3 p-4 bg-gray-50 rounded-2xl">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onAnswerClick({
                            dimension: question.dimension,
                            value: option.value
                        })}
                        className={`w-14 h-14 rounded-full border-2 transform transition-all duration-300
                            hover:scale-110 hover:shadow-lg
                            ${option.value > 0.5 ? 'border-emerald-500 bg-gradient-to-br from-emerald-100 to-emerald-200 hover:from-emerald-200 hover:to-emerald-300' : 
                             option.value < 0.5 ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300' : 
                             'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'}
                        `}
                        title={option.label}
                    >
                        <span className="text-xs font-medium">
                            {(option.value * 100).toFixed(0)}%
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Question;
