"use client";

import { useState, useTransition, useRef } from "react";
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), {
  ssr: false
});
import { quizOptions, challenges, wordOptions } from "@/db/schema";
import { toast } from "sonner";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { MultiChoices } from "./multible-choice";
import { Footer } from "./footer";
import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { reduceHearts } from "@/actions/user-progress";
import { useAudio, useWindowSize, useMount } from "react-use";
import { LessonEndScreen } from "./lesson-end-screen";
import { useRouter } from "next/navigation";
import { useSfx } from "@/hooks/use-sfx";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";
// Phase 2: Keep lightweight challenges static
import { TextChallenge } from "./text-challenge";
import { ImageChallenge } from "./image-challenge";
import { CompleteChallenge } from "./complete-challenge";
import { WriteChallenge } from "./write-challenge";
import { ChallengeSkeleton } from "@/components/ui/challenge-skeleton";
import { useChallengePrefetch } from "./use-challenge-prefetch";
import { useNextLessonPrefetch } from "./use-next-lesson-prefetch";
import { ChallengeMotion } from "./challenge-motion";
import { FloatingXP } from "@/components/floating-xp";

// Phase 2: Dynamic import heavy challenge types to reduce initial bundle
const VideoChallenge = dynamic(() => import("./video-challenge").then(m => ({ default: m.VideoChallenge })), {
  loading: () => <ChallengeSkeleton />,
  ssr: false
});

const PdfChallenge = dynamic(() => import("./pdf-challenge").then(m => ({ default: m.PdfChallenge })), {
  loading: () => <ChallengeSkeleton />,
  ssr: false
});

const CodeChallenge = dynamic(() => import("./code-challenge").then(m => ({ default: m.CodeChallenge })), {
  loading: () => <ChallengeSkeleton />,
  ssr: false
});

const WebView = dynamic(() => import("./web-view").then(m => ({ default: m.WebView })), {
  loading: () => <ChallengeSkeleton />,
  ssr: false
});

const AudioChallenge = dynamic(() => import("./audio-challenge").then(m => ({ default: m.AudioChallenge })), {
  loading: () => <ChallengeSkeleton />,
  ssr: false
});

const ProjectV3Challenge = dynamic(() => import("./projectv3-challenge"), {
  loading: () => <ChallengeSkeleton />,
  ssr: false
});

type Props = {
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    quizOptions: (typeof quizOptions.$inferSelect)[];
    wordOptions?: (typeof wordOptions.$inferSelect)[];
  })[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userSubscription: any;
};

export const Challenge = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  initialLessonChallenges,
  userSubscription,
}: Props) => {
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();

  useMount(() => {
    if (initialPercentage === 100) {

      openPracticeModal();
    }
  });

  const { width, height } = useWindowSize();
  const router = useRouter();

  const [finishAudio] = useAudio({ src: "/finish.mp3", autoPlay: false });

  // Phase 4: SFX system for instant sound feedback
  const sfx = useSfx();

  // Phase 6: FloatingXP reward feedback
  const [showFloatingXP, setShowFloatingXP] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incorrectAudio, _i, incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });

  const [pending, startTransition] = useTransition();
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  // used in final screen
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lessonId, setLessonId] = useState(initialLessonId);

  // Phase 5: Lesson End Screen state management
  // This flag ensures the end screen shows only once and prevents double renders
  const [showLessonEndScreen, setShowLessonEndScreen] = useState(false);
  const [isNavigatingFromEndScreen, setIsNavigatingFromEndScreen] = useState(false);

  // BUG FIX: Guard ref to prevent multiple triggers of end screen
  const hasShownEndScreen = useRef(false);

  // Phase 3: Optimistic UI state
  const [hearts, setHearts] = useState(initialHearts);
  // BUG FIX: Don't reset percentage to 0 when it's 100% - this causes re-renders
  const [percentage, setPercentage] = useState(initialPercentage);

  // Phase 3: Prefetch next lesson when component mounts
  useMount(() => {
    const currentChallengeIndex = challenges.findIndex(c => c.id === challenge?.id);
    const isLastChallenge = currentChallengeIndex === challenges.length - 1;
    if (isLastChallenge) {
      // Prefetch /learn for lesson completion
      router.prefetch('/learn');
    }
  });

  const [challenges] = useState(initialLessonChallenges);
  const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex(
      (challenge) => !challenge.completed
    );
    return uncompletedIndex === -1 ? 0 : uncompletedIndex; // Find the first uncompleted challenge or default to 0
  });

  const challenge = challenges[activeIndex];

  // ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURNS
  const [selectedOption, setSelectedOption] = useState<number | undefined>();
  const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");

  // Phase 4: Aggressive challenge-to-challenge prefetching
  // Prefetch N+1 and N+2 challenges, preload heavy components
  useChallengePrefetch({
    challenges: challenges.map(c => ({ id: c.id, type: c.type, order: c.order })),
    activeIndex,
    lessonId,
    onLastChallenge: activeIndex === challenges.length - 1,
  });

  // Phase 4: Next lesson prefetching
  // Prefetch next lesson when user is near the end (2 challenges before completion)
  useNextLessonPrefetch({
    currentLessonId: lessonId,
    activeIndex,
    totalChallenges: challenges.length,
    triggerThreshold: 2,
  });

  // Phase 4: Aggressive challenge-to-challenge prefetching
  // Prefetch N+1 and N+2 challenges, preload heavy components
  useChallengePrefetch({
    challenges: challenges.map(c => ({ id: c.id, type: c.type, order: c.order })),
    activeIndex,
    lessonId,
    onLastChallenge: activeIndex === challenges.length - 1,
  });

  // Phase 4: Next lesson prefetching
  // Prefetch next lesson when user is near the end (2 challenges before completion)
  useNextLessonPrefetch({
    currentLessonId: lessonId,
    activeIndex,
    totalChallenges: challenges.length,
    triggerThreshold: 2,
  });

  // EARLY RETURN: Show lesson end screen if no challenge exists (lesson completed)
  // Trigger condition: activeIndex >= challenges.length
  // BUG FIX: Use ref guard to prevent multiple triggers and ensure end screen stays visible
  if (!challenge && !hasShownEndScreen.current) {
    hasShownEndScreen.current = true;
    setShowLessonEndScreen(true);
  }

  if (showLessonEndScreen) {
    const xpEarned = challenges.length * 10;
    const heartsGained = Math.max(0, hearts - initialHearts);
    const lessonProgress = 100;
    const challengesCompleted = challenges.filter(c => c.completed).length;

    const handleContinue = async () => {
      setIsNavigatingFromEndScreen(true);
      router.push("/learn");
    };

    const handleBackToLessons = () => {
      setIsNavigatingFromEndScreen(true);
      router.push("/learn");
    };

    return (
      <>
        {finishAudio}
        {typeof window !== 'undefined' && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
            tweenDuration={10000}
          />
        )}

        <LessonEndScreen
          heartsGained={heartsGained}
          xpEarned={xpEarned}
          challengesCompleted={challengesCompleted}
          totalChallenges={challenges.length}
          lessonProgress={lessonProgress}
          onContinue={handleContinue}
          onBackToLessons={handleBackToLessons}
          isNavigating={isNavigatingFromEndScreen}
        />
      </>
    );
  }

  // Safe to access challenge properties now
  const options = challenge.quizOptions ?? [];

  // For COMPLETE challenges, use wordOptions instead of quizOptions
  const completeWords = challenge.type === "COMPLETE" && Array.isArray(challenge.wordOptions) ?
    challenge.wordOptions
      .sort(() => Math.random() - 0.5)
      .map(opt => ({
        id: opt.id,
        word: opt.word,
        order: opt.order,
        correct: opt.correct
      }))
    : [];

  const handleTextComplete = () => {
    startTransition(() => {
      upsertChallengeProgress(challenge.id, lessonId)
        .then((response) => {
          if (response?.error === "hearts") {
            openHeartsModal();
            return;
          }
          correctControls.play();
          setPercentage((prev) => prev + 100 / challenges.length);
          onNext();
        })
        .catch(() => {
          toast.error("Something went wrong!");
        });
    });
  };

  const onNext = () => {
    sfx.playTransition(); // Phase 4: Play transition sound when moving to next challenge
    setActiveIndex((current) => current + 1);
  };

  const onSelect = (id: number) => {
    if (status !== "none" || isCheckingAnswer) return;
    setSelectedOption(id);
  };

  const onContinue = () => {
    console.log(selectedOption);
    if (!selectedOption) return;

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    if (status === "correct") {
      sfx.playTransition(); // Phase 4: Play transition sound on continue
      onNext();
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    // Prevent double calls
    if (isCheckingAnswer) return;

    const correctOption = options.find((option) => option.correct);

    if (!correctOption) {
      return;
    }

    if (correctOption.id === selectedOption) {
      console.log("Correct option!");
      setIsCheckingAnswer(true);

      // Phase 3: Optimistic UI update
      const optimisticPercentage = percentage + 100 / challenges.length;
      const optimisticHearts = initialPercentage === 100 ? Math.min(hearts + 1, 5) : hearts;
      setPercentage(optimisticPercentage);
      if (initialPercentage === 100) {
        setHearts(optimisticHearts);
      }

      startTransition(() => {
        upsertChallengeProgress(challenge.id, lessonId)
          .then((response) => {
            if (response?.error === "hearts") {
              // Rollback optimistic update
              setPercentage(percentage);
              setHearts(hearts);
              openHeartsModal();
              setIsCheckingAnswer(false);
              return;
            }

            correctControls.play();
            sfx.playSuccess(); // Phase 4: Play success sound
            setShowFloatingXP(true); // Phase 6: Show XP reward feedback
            setStatus("correct");
            console.log("Percentage:", optimisticPercentage);
            setIsCheckingAnswer(false);
          })
          .catch(() => {
            // Phase 3: Rollback optimistic update on error
            setPercentage(percentage);
            setHearts(hearts);
            toast.error("Something went wrong!");
            setIsCheckingAnswer(false);
          });
      });
    } else {
      setIsCheckingAnswer(true);

      // Phase 3: Optimistic UI update for hearts reduction
      const optimisticHearts = Math.max(hearts - 1, 0);
      setHearts(optimisticHearts);

      startTransition(() => {
        reduceHearts(challenge.id, lessonId)
          .then((response) => {
            if (response?.error === "hearts") {
              // Rollback optimistic update
              setHearts(hearts);
              openHeartsModal();
              setIsCheckingAnswer(false);
              return;
            }

            // Practice mode - no hearts lost
            if (response?.error === "practice") {
              // Rollback optimistic update for practice mode
              setHearts(hearts);
              toast.info("Practice mode: no hearts lost", {
                duration: 2000,
              });
              incorrectControls.play();
              setStatus("wrong");
              setIsCheckingAnswer(false);
              return;
            }

            incorrectControls.play();
            sfx.playFail(); // Phase 4: Play fail sound
            setStatus("wrong");
            setIsCheckingAnswer(false);
          })
          .catch(() => {
            // Phase 3: Rollback optimistic update on error
            setHearts(hearts);
            toast.error("Something went wrong!");
            setIsCheckingAnswer(false);
          });
      });
    }
  };

  // Render image challenge if type is IMAGE
  if (challenge && challenge.type === "IMAGE" && challenge.imageContent) {
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full">
          <ImageChallenge
            content={challenge.imageContent}
            onComplete={handleTextComplete}
          />
        </div>
      </div>
    );
  }

  // Render video challenge if type is VIDEO
  if (challenge && challenge.type === "VIDEO" && challenge.videoURL) {
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full">
          <VideoChallenge
            content={challenge.videoURL}
            onComplete={handleTextComplete}
          />
        </div>
      </div>
    );
  }

  // Render audio challenge if type is AUDIO
  if (challenge && challenge.type === "AUDIO") {
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full">
          <AudioChallenge
            audioUrl={challenge.audioURL || ""}
            label={challenge.label}
            onComplete={handleTextComplete}
            disabled={pending}
          />
        </div>
      </div>
    );
  }

  // Render Write challenge if type is WRITE
  if (challenge.type === "WRITE" && Array.isArray(challenge.wordOptions)) {
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full">
          <WriteChallenge
            words={challenge.wordOptions.map(opt => ({
              id: opt.id,
              word: opt.word,
              order: opt.order,
              correct: opt.correct
            }))}
            question={challenge.completeQuestion || ""}
            onComplete={() => handleTextComplete()}
            disabled={status === "correct"}
          />
        </div>
      </div>
    );
  }

  // Render PDF challenge if type is PDF
  if (challenge && challenge.type === "PDF" && challenge.pdfURL) {
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full">
          <PdfChallenge
            pdfUrl={challenge.pdfURL}
            onComplete={handleTextComplete}
          />
        </div>
      </div>
    );
  }

  // Render code challenge if type is CODE
  if (challenge && challenge.type === "CODE" && challenge.initialCode) {
    let testCases;
    try {
      testCases = JSON.parse(challenge.testCases || '[]');
      if (!Array.isArray(testCases)) testCases = [];
      // Ensure each test case has the required structure
      testCases = testCases.map(test => ({
        input: String(test.input || ''),
        expectedOutput: String(test.expectedOutput || ''),
        isHidden: Boolean(test.isHidden)
      }));
    } catch (error) {
      console.error('Error parsing test cases:', error);
      testCases = [];
    }
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full">
          <CodeChallenge
            initialCode={challenge.initialCode}
            language={challenge.language as "python" | "javascript" | "typescript"}
            instructions={challenge.instructions || ''}
            testCases={testCases}
            onComplete={handleTextComplete}
          />
        </div>
      </div>
    );
  }

  // Render text challenge if type is TEXT
  if (challenge && challenge.type === "TEXT") {
    if (challenge.webViewContent) {
      return (
        <div className="h-full">
          <Header
            hearts={hearts}
            percentage={percentage}
            hasActiveSubscription={!!userSubscription}
          />
          <div className="flex-1 h-full">
            <WebView
              content={challenge.webViewContent}
              onComplete={handleTextComplete}
            />
          </div>
        </div>
      );
    } else if (challenge.textContent) {
      return (
        <div className="h-full">
          <Header
            hearts={hearts}
            percentage={percentage}
            hasActiveSubscription={!!userSubscription}
          />
          <div className="flex-1 h-full">
            <TextChallenge
              content={challenge.textContent}
              onComplete={handleTextComplete}
            />
          </div>
        </div>
      );
    }
  }

  if (challenge && challenge.type === "COMPLETE") {
    return (
      <div className="h-full">
        <Header
          hearts={hearts}
          percentage={percentage}
          hasActiveSubscription={!!userSubscription}
        />
        <div className="flex-1 h-full flex flex-col items-center justify-center px-4">
          <CompleteChallenge
            words={completeWords}
            onComplete={handleTextComplete}
            disabled={pending}
            question={challenge.completeQuestion || ''}
          />
        </div>
      </div>
    );
  }

  // تحديد عنوان التحدي بناءً على نوعه
  let title: string;
  switch (challenge.type) {
    case "ASSIST":
      title = "Select the correct meaning";
      break;
    case "SELECT":
      title = "Choose the correct option";
      break;
    case "CODE":
      title = "Write the correct code";
      break;
    case "VIDEO":
      title = "Watch the video";
      break;
    case "AUDIO":
      title = "Listen to the audio";
      break;
    case "TEXT":
      title = "Read the text";
      break;
    case "COMPLETE":
      title = "Complete the sentence";
      break;
    case "PROJECT":
      title = "Build the project";
      break;
    default:
      title = challenge.label; // إذا كان النوع غير معروف
  }

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <FloatingXP
        value={10}
        show={showFloatingXP}
        onComplete={() => setShowFloatingXP(false)}
      />
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />

      <div className="flex-1">
        <div className="h-full flex items-center justify-center">
          <ChallengeMotion type={challenge.type} challengeId={challenge.id}>
            <div className="lg:min-h-[400px] lg:w-[1000px] w-full px-6 lg:px-0 flex flex-col gap-y-12">
              <h1 className="text-md lg:text-xl text-center lg:text-start font-bold text-neutral-700">
                {title}
              </h1>
              <div>
                {challenge.type === "SELECT" && (
                  <>
                    <QuestionBubble question={challenge.label} />
                    <MultiChoices
                      options={options}
                      onSelect={onSelect}
                      status={status}
                      selectedOption={selectedOption}
                      disabled={pending}
                      type={challenge.type}
                    />
                    <Footer
                      onCheck={onContinue}
                      status={status}
                      disabled={!selectedOption || pending || isCheckingAnswer}
                      lessonId={lessonId}
                      explanation={challenge.explanation || undefined}
                    />
                  </>
                )}

                {challenge.type === "PROJECT" && (
                  <div className="w-full h-[calc(100vh-12rem)]">
                    <ProjectV3Challenge
                      projectId={challenge.id.toString()}
                      projectStructure={challenge.projectStructure || "[]"}
                      projectFiles={challenge.projectFiles || "{}"}
                      language={challenge.language || "javascript"}
                      disabled={status === "correct"}
                      onSubmit={() => {
                        // TODO: In future work, add code validation here
                        // For now, just mark as correct and move to next challenge
                        handleTextComplete();
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </ChallengeMotion>
        </div>
      </div>
    </>
  );
};
