import { getLesson, getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";
import { Challenge } from "../challenge";

type Props = {
  params: {
    lessonId: number;
  };
};


const LessonIdPage = async ({params}:Props) => {
  const lessonData = getLesson(params.lessonId);
  const userProgressData = getUserProgress();

  const [lesson, userProgress] = await Promise.all([
    // Corrected the array destructuring and fixed the missing variable assignment
    lessonData,
    userProgressData,
  ]);

  if (!lesson || !userProgress) {
    // Fixed the condition to properly check for missing data
    redirect("/learn");
  }

  const completedChallenges = lesson.challenges.filter(
    (challenge) => challenge.completed
  );

  const initialPercentage =
    (completedChallenges.length / lesson.challenges.length) * 100;

  return (
    <Challenge
      initialLessonId={lesson.id}
      initialLessonChallenges={lesson.challenges}
      initialHearts={userProgress.hearts}
      initialPercentage={initialPercentage}
      userSubscription={null}
    />
  );
};

export default LessonIdPage;
