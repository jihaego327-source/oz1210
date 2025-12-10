"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 방식 (JWT 템플릿 deprecated):
 * - JWT 템플릿 불필요
 * - Clerk 세션 토큰을 Supabase가 자동으로 검증
 * - useAuth().getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * @see {@link https://clerk.com/docs/guides/development/integrations/databases/supabase | Clerk Supabase 통합 가이드}
 * @see {@link https://supabase.com/docs/guides/auth/third-party/overview | Supabase Third-Party Auth 문서}
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 * import { useUser } from '@clerk/nextjs';
 * import { useEffect, useState } from 'react';
 *
 * export default function MyComponent() {
 *   const { user, isLoaded } = useUser();
 *   const supabase = useClerkSupabaseClient();
 *   const [tasks, setTasks] = useState([]);
 *
 *   useEffect(() => {
 *     if (!isLoaded || !user) return;
 *
 *     async function loadTasks() {
 *       const { data } = await supabase.from('tasks').select('*');
 *       if (data) setTasks(data);
 *     }
 *
 *     loadTasks();
 *   }, [user, isLoaded, supabase]);
 *
 *   return <div>{/* ... */}</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        return (await getToken()) ?? null;
      },
    });
  }, [getToken]);

  return supabase;
}
