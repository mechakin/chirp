import { PageLayout } from "~/components/layout";
import Head from "next/head";
import Link from "next/link";

export function NotFound() {
  return (
    <PageLayout>
      <Head>
        <title>404 not found</title>
      </Head>
      <div className="flex flex-col items-center justify-center pt-14">
        <h1 className="text-lg">this page does not exist :{"("}</h1>
        <Link
          href={".."}
          className="mt-2 rounded-full bg-slate-600 py-2 px-3 text-lg"
        >
          go back
        </Link>
      </div>
    </PageLayout>
  );
}
