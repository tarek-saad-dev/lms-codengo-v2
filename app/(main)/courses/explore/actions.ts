'use server';

import { assignCoursesToUser } from '@/db/queries';

export async function enrollInCourses(courseIds: number[]) {
  try {
    const enrolledCourses = await assignCoursesToUser(courseIds);
    return { success: true, courses: enrolledCourses };
  } catch {
    return { success: false, error: 'Failed to enroll in courses' };
  }
}
