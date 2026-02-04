"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import Question from './Question';

interface Question {
  _id: string;
  question: string;
  choice1: string;
  choice2: string;
  dimension: string;
}

interface ResultsScreenProps {
  scores: {
    learning_style_active_reflective: number;
    learning_style_visual_verbal: number;
    learning_style_sensing_intuitive: number;
    learning_style_sequential_global: number;
  };
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ scores }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
        Your Learning Style Results
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active-Reflective */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-emerald-600 font-semibold">Active-Reflective</h3>
            <span className="text-lg font-bold">
              {(scores.learning_style_active_reflective * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${scores.learning_style_active_reflective * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Active</span>
            <span>Reflective</span>
          </div>
        </div>

        {/* Visual-Verbal */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-emerald-600 font-semibold">Visual-Verbal</h3>
            <span className="text-lg font-bold">
              {(scores.learning_style_visual_verbal * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${scores.learning_style_visual_verbal * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Visual</span>
            <span>Verbal</span>
          </div>
        </div>

        {/* Sensing-Intuitive */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-emerald-600 font-semibold">Sensing-Intuitive</h3>
            <span className="text-lg font-bold">
              {(scores.learning_style_sensing_intuitive * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${scores.learning_style_sensing_intuitive * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Sensing</span>
            <span>Intuitive</span>
          </div>
        </div>

        {/* Sequential-Global */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-emerald-600 font-semibold">Sequential-Global</h3>
            <span className="text-lg font-bold">
              {(scores.learning_style_sequential_global * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${scores.learning_style_sequential_global * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span>Sequential</span>
            <span>Global</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LearningStyleQuiz = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScores, setFinalScores] = useState<ResultsScreenProps['scores'] | null>(null);
  const [dimensionScores, setDimensionScores] = useState<{ [key: string]: number[] }>({
    "active&reflective": [],
    "visual&verbal": [],
    "sensing&intuitive": [],
    "sequential&global": [],
  });
  const { userId, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(
          "https://graduation-learners-module-backend.vercel.app/questions"
        );
        setQuestions(response.data);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions");
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = async ({ dimension, value }: { dimension: string; value: number }) => {
    try {
      // Fix dimension name if it's in wrong order
      const correctDimension = dimension === 'intuitive&sensing' ? 'sensing&intuitive' : dimension;

      // First, update the scores with the current answer
      const updatedScores = {
        ...dimensionScores,
        [correctDimension]: [...(dimensionScores[correctDimension] || []), value],
      };

      // Wait for state update to complete
      await new Promise<void>((resolve) => {
        setDimensionScores(updatedScores);
        resolve();
      });

      // If not the last question, just move to next
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        return;
      }

      // Handle last question
      if (!userId || !user?.emailAddresses?.[0]?.emailAddress) {
        toast.error("Please sign in with an email address to save your results");
        return;
      }

      const userEmail = user.emailAddresses[0].emailAddress;
      const token = await getToken();

      // Calculate final scores using the most recent scores
      const finalScores = {
        "active&reflective": updatedScores["active&reflective"] || [],
        "visual&verbal": updatedScores["visual&verbal"] || [],
        "sensing&intuitive": updatedScores["sensing&intuitive"] || [],
        "sequential&global": updatedScores["sequential&global"] || [],
      };

      // Debug logs
      console.log('Updated scores:', updatedScores);
      console.log('Final scores before calculation:', finalScores);
      console.log('Last answer:', { dimension: correctDimension, value });

      // Calculate normalized scores
      const normalizedScores = {
        learning_style_active_reflective: Number(calculateAverageScore(finalScores["active&reflective"]).toFixed(3)),
        learning_style_visual_verbal: Number(calculateAverageScore(finalScores["visual&verbal"]).toFixed(3)),
        learning_style_sensing_intuitive: Number(calculateAverageScore(finalScores["sensing&intuitive"]).toFixed(3)),
        learning_style_sequential_global: Number(calculateAverageScore(finalScores["sequential&global"]).toFixed(3)),
      };

      console.log('Calculated normalized scores:', normalizedScores);

      // Save results to the server
      const response = await axios.patch(
        "https://graduation-learners-module-backend.vercel.app/api/learner/learning-styles",
        {
          email: userEmail,
          learnerId: Number(userId),  // Convert Clerk userId to number
          ...normalizedScores,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('API Response:', response);

      if (response.status === 200) {
        toast.success("Learning style assessment completed!");
        setFinalScores(normalizedScores);
        setQuizCompleted(true);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error in quiz:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to save results: ${error.response.data?.message || 'Unknown error'}`);
      } else {
        toast.error("Failed to save results. Please try again.");
      }
    }
  };

  const calculateAverageScore = (scores: number[]) => {
    if (!scores || scores.length === 0) return 0.5;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return average;
  };

  if (questions.length === 0) {
    return <div className="text-center p-6">Loading questions...</div>;
  }

  if (quizCompleted && finalScores) {
    return <ResultsScreen scores={finalScores} />;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2 max-w-2xl mx-auto">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </div>

      <Question 
        question={questions[currentQuestion]}
        onAnswerClick={handleAnswer}
      />
    </div>
  );
};

export default LearningStyleQuiz;
