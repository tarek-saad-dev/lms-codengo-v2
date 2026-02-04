import { getLesson, getUserProgress } from "@/db/queries";
import { redirect } from "next/navigation";
import { Challenge } from "./challenge";
const LessonPage = async () => {
  const lessonData = getLesson();
  const userProgressData = getUserProgress();

  const [lesson, userProgress] = await Promise.all([
    lessonData,
    userProgressData,
  ]);

  if (!lesson || !userProgress) {
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

export default LessonPage;

/*
Data Loading: When the user enters the lesson page, the application begins loading the user's lesson and progress data from the database.

Data Validation: After the data is loaded, we check whether it is present. If the data is missing, the user is redirected to another page that displays other lessons or asks them to register in the application.

Percentage Calculation: Once we have the data, we begin filtering the completed challenges and calculate the percentage of challenges the user has completed out of the total challenges in the lesson.

Data Passing to the Component: Finally, we pass this data to the Challenge component, which displays the remaining challenges to the user, along with the completion percentage and other information that helps personalize the learning experience.
*/