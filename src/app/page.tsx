'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#030712',
      color: '#6366f1',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(99, 102, 241, 0.1)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
