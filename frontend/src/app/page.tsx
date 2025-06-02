'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAppStore } from '@/lib/store';
import { authApi, projectsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { setUser, setProjects } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const userRes = await authApi.me();
        setUser(userRes.data);
        
        if (!userRes.data.is_verified) {
          localStorage.setItem('pendingVerificationEmail', userRes.data.email);
          router.push('/verify');
          return;
        }
        
        const projectsRes = await projectsApi.list();
        setProjects(projectsRes.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load user or projects. Please try again.');
          setUser(null);
          setProjects([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [setUser, setProjects, router]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return <MainLayout />;
}