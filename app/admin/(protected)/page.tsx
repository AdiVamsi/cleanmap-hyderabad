import { SpotQueue } from "@/components/admin/SpotQueue";
import { getAdminSpots } from "@/lib/admin-spots";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const spots = await getAdminSpots();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-normal text-ink">
          Spot queue
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Review and manage reported cleanup spots.
        </p>
      </div>

      <SpotQueue spots={spots} />
    </div>
  );
}
