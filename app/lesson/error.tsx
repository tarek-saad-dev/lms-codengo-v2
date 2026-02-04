'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function Error() {
  const router = useRouter();

  useEffect(() => {
    toast.error('Lesson not found or user progress unavailable.');
    router.push('/learn');
  }, [router]);

  return null;
}
