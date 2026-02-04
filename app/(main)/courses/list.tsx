'use client'
import { courses, userProgress } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { useRouter } from "next/navigation";
import Card from "./card";
import { useTransition } from "react";


import { setActiveCourse } from "@/actions/user-progress";


type props = {
    courses: InferSelectModel<typeof courses>[];
    activeCourseId?: InferSelectModel<typeof userProgress>["activeCourseId"];
}


export default function List({ courses, activeCourseId }: props) {
    const router = useRouter();
    const [pending , startTransition] = useTransition();

    const onClick = async (courseId: number) => {
        if (pending) return;

        if (courseId === activeCourseId) {
            router.push("/learn");
            return;
        };

        startTransition(() => {
            setActiveCourse(courseId);
        });
    }

    return (
        <div className="pt-6 grid grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    imageSrc={course.imageSrc}
                    active={activeCourseId ? course.id === activeCourseId : false}
                    onClick={onClick}
                    disabled={pending}
                    type={course.type}
                    makerId={course.makerId}
                />
            ))}
        </div>
    );
}
