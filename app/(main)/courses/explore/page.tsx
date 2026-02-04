import ExploreClient from './explore-client';
import { getExplorePageData } from './page.server';

export default async function ExplorePage() {
  const data = await getExplorePageData();
  return <ExploreClient initialCourses={data.courses} categories={data.categories} />;
}
