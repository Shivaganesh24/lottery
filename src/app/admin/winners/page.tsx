'use client';

// Redirect to the winners tab on the main admin page for simplicity in this prototype
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminWinnersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return null;
}
