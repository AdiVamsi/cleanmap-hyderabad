import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPanel } from "@/components/admin/StatusPanel";
import { getAdminSpotWithDetails } from "@/lib/admin-spots";

export const dynamic = "force-dynamic";

type AdminSpotPageProps = {
  params: {
    id: string;
  };
};

export default async function AdminSpotPage({ params }: AdminSpotPageProps) {
  const spot = await getAdminSpotWithDetails(params.id);

  if (!spot) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex text-sm font-bold text-slate-500 transition hover:text-ink"
      >
        ← Back to queue
      </Link>

      <StatusPanel spot={spot} />
    </div>
  );
}
