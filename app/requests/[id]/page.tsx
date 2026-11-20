import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderBook } from "@/components/order-book";
import { getCurrentUser } from "@/lib/auth";
import { load } from "@/lib/load";
import { getRequest } from "@/lib/queries";

export const metadata = { title: "Order book" };

export default function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; confirm?: string }>;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/requests" className="text-sm text-muted underline decoration-line underline-offset-4">
        All requests
      </Link>
      <div className="mt-4">
        <Suspense fallback={<p className="font-display text-3xl">Opening the book…</p>}>
          <Book params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Book({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; confirm?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const loaded = await load(() => getRequest(id));
  if (!loaded.ok) {
    return (
      <p role="alert" className="border border-danger px-4 py-6 text-sm text-danger">
        The book is unreachable right now.
      </p>
    );
  }
  if (!loaded.value) notFound();
  const user = await getCurrentUser();
  return (
    <OrderBook
      request={loaded.value.request}
      user={user}
      now={loaded.value.now}
      notice={query.notice}
      confirmId={query.confirm}
    />
  );
}
