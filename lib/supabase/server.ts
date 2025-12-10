import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component/Server Action용)
 *
 * 2025년 4월부터 권장되는 방식 (JWT 템플릿 deprecated):
 * - JWT 템플릿 불필요
 * - Clerk 세션 토큰을 Supabase가 자동으로 검증
 * - auth().getToken()으로 현재 세션 토큰 사용
 * - Server Component와 Server Action에서 사용
 * - Next.js 15의 async API를 지원하여 `await createClient()` 패턴 사용 가능
 *
 * @see {@link https://clerk.com/docs/guides/development/integrations/databases/supabase | Clerk Supabase 통합 가이드}
 * @see {@link https://supabase.com/docs/guides/auth/third-party/overview | Supabase Third-Party Auth 문서}
 * @see {@link https://supabase.com/docs/guides/getting-started/quickstarts/nextjs | Supabase Next.js 퀵스타트}
 *
 * @example
 * ```tsx
 * // Server Component (Next.js 15 패턴 - 공식 문서 예제)
 * import { createClient } from '@/lib/supabase/server';
 * import { Suspense } from 'react';
 *
 * async function InstrumentsData() {
 *   const supabase = await createClient();
 *   const { data: instruments, error } = await supabase
 *     .from('instruments')
 *     .select();
 *
 *   if (error) {
 *     throw error;
 *   }
 *
 *   return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
 * }
 *
 * export default function Instruments() {
 *   return (
 *     <Suspense fallback={<div>Loading instruments...</div>}>
 *       <InstrumentsData />
 *     </Suspense>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Server Component (간단한 패턴)
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from('tasks').select('*');
 *
 *   if (error) {
 *     throw error;
 *   }
 *
 *   return (
 *     <div>
 *       {data?.map((task) => <p key={task.id}>{task.name}</p>)}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```ts
 * // Server Action
 * 'use server';
 *
 * import { createClient } from '@/lib/supabase/server';
 *
 * export async function addTask(name: string) {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase
 *     .from('tasks')
 *     .insert({ name });
 *
 *   if (error) {
 *     throw new Error('Failed to add task');
 *   }
 *
 *   return data;
 * }
 * ```
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      return (await auth()).getToken();
    },
  });
}
