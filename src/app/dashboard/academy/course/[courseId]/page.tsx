'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLoader from '@/components/PageLoader';

export default function CourseRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  useEffect(() => {
    let isMounted = true;

    async function redirect() {
      try {
        console.log('[CourseRedirect] Redirecionando para o primeiro módulo do curso:', courseId);

        // 1. Tentar buscar módulos diretamente pela API do curso
        const res = await fetch(`/api/modules?courseId=${encodeURIComponent(courseId)}`, {
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.modules) && data.modules.length > 0) {
            const sorted = data.modules.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            const targetModuleId = sorted[0].id;
            console.log('[CourseRedirect] Redirecionando para:', targetModuleId);
            if (isMounted) {
              router.replace(`/dashboard/academy/course/${courseId}/chapter/${targetModuleId}`);
              return;
            }
          }
        }

        // 2. Fallback: buscar todos os módulos
        const allRes = await fetch('/api/modules', { cache: 'no-store' });
        if (allRes.ok) {
          const allData = await allRes.json();
          if (Array.isArray(allData.modules) && allData.modules.length > 0) {
            const matching = allData.modules
              .filter((m: any) => m.courseId === courseId)
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

            const target = matching[0] || allData.modules[0];
            if (target && isMounted) {
              router.replace(`/dashboard/academy/course/${courseId}/chapter/${target.id}`);
              return;
            }
          }
        }

        // Se não encontrar nenhum módulo, volta para a academia
        if (isMounted) {
          router.replace('/dashboard/academy');
        }
      } catch (err) {
        console.error('[CourseRedirect] Erro ao buscar módulos:', err);
        if (isMounted) {
          router.replace('/dashboard/academy');
        }
      }
    }

    if (courseId) {
      redirect();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, router]);

  return <PageLoader text="A carregar curso..." />;
}
