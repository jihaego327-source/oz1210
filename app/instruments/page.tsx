import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

/**
 * Supabase 공식 Next.js 퀵스타트 예제 페이지
 *
 * @see {@link https://supabase.com/docs/guides/getting-started/quickstarts/nextjs | Supabase Next.js 퀵스타트}
 */
async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();

  if (error) {
    throw error;
  }

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}

export default function Instruments() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Instruments</h1>
      <p className="text-muted-foreground mb-4">
        Supabase 공식 Next.js 퀵스타트 예제입니다.
      </p>
      <Suspense fallback={<div>Loading instruments...</div>}>
        <InstrumentsData />
      </Suspense>
    </div>
  );
}

