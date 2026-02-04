import { getGlobalCoursesAndCategories } from "@/db/queries";

export async function getExplorePageData() {
  const data = await getGlobalCoursesAndCategories();
  return {
    courses: data.courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      image: course.imageSrc,
      category: course.category,
      demo: course.demo || null,
      price: course.price,
      xp: course.xp,
    })),
    categories: data.categories,
  };
}
