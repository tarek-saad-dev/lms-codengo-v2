'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CourseButtons() {
  const router = useRouter();

  return (
    <div className="flex gap-4">
      <Button
        variant="primary"
        size="lg"
        onClick={() => router.push('/courses/explore')}
      >
        Explore All Courses
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => router.push('/courses/customize')}
      >
        Customize Your Course
      </Button>
    </div>
  );
}
