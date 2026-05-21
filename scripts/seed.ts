import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedSpot = {
  title: string;
  description: string;
  address: string;
  ward: string;
  latitude: number;
  longitude: number;
  severity: "minor" | "noticeable" | "severe" | "critical";
  status: "approved" | "cleanup_planned" | "cleaned" | "pending";
  cleanup_date?: string | null;
  reported_by_name: string;
  reported_by_phone?: string | null;
};

type InsertedSpot = {
  id: string;
  title: string;
  status: SeedSpot["status"];
};

function loadEnvFile(fileName: string) {
  const path = resolve(process.cwd(), fileName);

  if (!existsSync(path)) {
    return;
  }

  const file = readFileSync(path, "utf8");

  for (const line of file.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...parts] = trimmed.split("=");
    const rawValue = parts.join("=").trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    process.env[key.trim()] ??= value;
  }
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function dateFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const seedSpots: SeedSpot[] = [
  {
    title: "Overflowing bins near Road No. 12",
    description: "Overflowing municipal bins are spilling food waste onto the service lane near the post office.",
    address: "Road No. 12, near Banjara Hills post office",
    ward: "Banjara Hills",
    latitude: 17.4128,
    longitude: 78.4476,
    severity: "severe",
    status: "approved",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00001"
  },
  {
    title: "Plastic waste behind market lane",
    description: "Loose plastic covers, tea cups, and food packaging have collected behind the vegetable shops.",
    address: "KPHB 6th Phase market lane",
    ward: "KPHB Colony",
    latitude: 17.4937,
    longitude: 78.3989,
    severity: "noticeable",
    status: "approved",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00002"
  },
  {
    title: "Debris outside bus stop",
    description: "Broken tiles and construction debris are blocking the edge of the footpath near the bus shelter.",
    address: "Near Secunderabad East Metro bus stop",
    ward: "Old Bowenpally",
    latitude: 17.4787,
    longitude: 78.4852,
    severity: "noticeable",
    status: "approved",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00003"
  },
  {
    title: "Garbage pile near community hall",
    description: "Household waste bags are piling up beside the boundary wall used by evening walkers.",
    address: "Kukatpally Housing Board community hall road",
    ward: "Kukatpally",
    latitude: 17.4952,
    longitude: 78.3918,
    severity: "severe",
    status: "approved",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00004"
  },
  {
    title: "Leaf litter and plastic by park gate",
    description: "Dry leaves, snack wrappers, and plastic cups are scattered around the park entrance.",
    address: "Himayatnagar park entrance near Street 5",
    ward: "Himayatnagar",
    latitude: 17.4028,
    longitude: 78.4846,
    severity: "minor",
    status: "approved",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00005"
  },
  {
    title: "Food waste near metro staircase",
    description: "Evening food-stall waste is collecting beside the metro staircase and needs a coordinated pickup.",
    address: "Madhapur main road near metro staircase",
    ward: "Madhapur",
    latitude: 17.4482,
    longitude: 78.3912,
    severity: "noticeable",
    status: "approved",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00006"
  },
  {
    title: "Cleanup scheduled near school wall",
    description: "Mixed litter has accumulated along the school compound wall after weekend street food traffic.",
    address: "Jubilee Hills Road No. 36, school side lane",
    ward: "Jubilee Hills",
    latitude: 17.432,
    longitude: 78.4079,
    severity: "noticeable",
    status: "cleanup_planned",
    cleanup_date: dateFromNow(4),
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00007"
  },
  {
    title: "Storm drain edge cleanup",
    description: "Waste is collecting by the storm drain and needs coordinated removal before the next rain.",
    address: "LB Nagar service road beside storm drain",
    ward: "Vanasthalipuram",
    latitude: 17.3351,
    longitude: 78.5607,
    severity: "severe",
    status: "cleanup_planned",
    cleanup_date: dateFromNow(9),
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00008"
  },
  {
    title: "IT corridor footpath cleanup",
    description: "Disposable cups and packaging are spread along the footpath near the office shuttle pickup point.",
    address: "Madhapur, near Durgam Cheruvu metro approach",
    ward: "Madhapur",
    latitude: 17.4487,
    longitude: 78.392,
    severity: "noticeable",
    status: "cleanup_planned",
    cleanup_date: dateFromNow(13),
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00009"
  },
  {
    title: "Market-side lane cleanup drive",
    description: "Flower market trimmings and plastic bags are blocking a side lane used by pedestrians.",
    address: "Himayatnagar main road behind flower market",
    ward: "Himayatnagar",
    latitude: 17.4034,
    longitude: 78.4834,
    severity: "noticeable",
    status: "cleanup_planned",
    cleanup_date: dateFromNow(12),
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00010"
  },
  {
    title: "Cleared waste beside temple lane",
    description: "A previously blocked corner near the temple lane has been cleared and swept by volunteers.",
    address: "Banjara Hills Road No. 10 temple lane",
    ward: "Banjara Hills",
    latitude: 17.4119,
    longitude: 78.4491,
    severity: "noticeable",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00011"
  },
  {
    title: "Cleared plastic near lake walkway",
    description: "Plastic bottles and snack packets along the lake walkway have been removed.",
    address: "Madhapur lake walkway entry point",
    ward: "Madhapur",
    latitude: 17.4493,
    longitude: 78.3908,
    severity: "minor",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00012"
  },
  {
    title: "Cleared trash beside colony road",
    description: "A roadside dump near the colony road has been cleared, swept, and marked for monitoring.",
    address: "KPHB Colony Phase 3 internal road",
    ward: "KPHB Colony",
    latitude: 17.4929,
    longitude: 78.4004,
    severity: "severe",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00013"
  },
  {
    title: "Cleared litter near Parade Ground footpath",
    description: "Volunteers removed paper plates and plastic waste from the footpath near the ground entrance.",
    address: "Secunderabad Parade Ground north gate footpath",
    ward: "Mettuguda",
    latitude: 17.4322,
    longitude: 78.5219,
    severity: "noticeable",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00014"
  },
  {
    title: "Cleared nala-side dumping corner",
    description: "A nala-side corner with mixed household waste has been cleared and disinfected.",
    address: "Kukatpally Y Junction nala-side street",
    ward: "Kukatpally",
    latitude: 17.4898,
    longitude: 78.3941,
    severity: "severe",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00015"
  },
  {
    title: "Cleared wrappers near park boundary",
    description: "Snack wrappers and plastic cups along the park boundary were removed after a weekend cleanup.",
    address: "Jubilee Hills Road No. 45 park boundary",
    ward: "Jubilee Hills",
    latitude: 17.4314,
    longitude: 78.4086,
    severity: "minor",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00016"
  },
  {
    title: "Cleared garbage beside depot wall",
    description: "A pile of garbage bags beside the depot wall was removed and the shoulder was swept clean.",
    address: "LB Nagar bus depot side wall",
    ward: "Vanasthalipuram",
    latitude: 17.3351,
    longitude: 78.5607,
    severity: "noticeable",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00017"
  },
  {
    title: "Cleared library lane waste",
    description: "Paper waste and plastic covers near the library lane were cleared by the morning volunteer team.",
    address: "Himayatnagar library lane near Street 8",
    ward: "Himayatnagar",
    latitude: 17.404,
    longitude: 78.4852,
    severity: "noticeable",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00018"
  },
  {
    title: "Cleared drain blockage near nala",
    description: "A hazardous nala-side pile blocking dirty water flow was cleared before it could overflow into the lane.",
    address: "LB Nagar nala crossing near Sagar Ring Road",
    ward: "Vanasthalipuram",
    latitude: 17.3351,
    longitude: 78.5607,
    severity: "critical",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00019"
  },
  {
    title: "Cleared dumping near lake bund",
    description: "Volunteers removed a critical mixed-waste pile near the lake bund and cleared the walking edge.",
    address: "Madhapur lake bund service path",
    ward: "Madhapur",
    latitude: 17.4501,
    longitude: 78.3899,
    severity: "critical",
    status: "cleaned",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00020"
  },
  {
    title: "Pending review near apartment lane",
    description: "Reporter submitted a new cleanup location for review.",
    address: "Jubilee Hills Film Nagar apartment lane",
    ward: "Jubilee Hills",
    latitude: 17.4331,
    longitude: 78.4062,
    severity: "noticeable",
    status: "pending",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00021"
  },
  {
    title: "Pending review by main road median",
    description: "New report needs admin verification before publication.",
    address: "Secunderabad main road median near clock tower",
    ward: "Mettuguda",
    latitude: 17.4322,
    longitude: 78.5219,
    severity: "minor",
    status: "pending",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00022"
  },
  {
    title: "Pending review beside store frontage",
    description: "Fresh report with photo awaiting review.",
    address: "LB Nagar inner road beside grocery frontage",
    ward: "Vanasthalipuram",
    latitude: 17.3351,
    longitude: 78.5607,
    severity: "severe",
    status: "pending",
    reported_by_name: "CleanMap Seed",
    reported_by_phone: "+91 90000 00023"
  }
];

const BEFORE_DEMO_PHOTOS = [
  "/demo-photos/hyderabad-before-market-lane.jpg",
  "/demo-photos/hyderabad-before-colony-drain.jpg",
  "/demo-photos/hyderabad-before-bus-stop.jpg",
  "/demo-photos/hyderabad-before-food-stall.jpg"
];

const AFTER_DEMO_PHOTOS = [
  "/demo-photos/hyderabad-after-market-lane.jpg",
  "/demo-photos/hyderabad-after-colony-drain.jpg",
  "/demo-photos/hyderabad-after-bus-stop.jpg",
  "/demo-photos/hyderabad-after-food-stall.jpg"
];

async function main() {
  const { data: existing, error: existingError } = await supabase
    .from("spots")
    .select("id")
    .eq("reported_by_name", "CleanMap Seed");

  if (existingError) {
    throw existingError;
  }

  const existingIds = existing?.map((spot) => spot.id) ?? [];

  if (existingIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("spots")
      .delete()
      .in("id", existingIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("spots")
    .insert(seedSpots)
    .select("id,title,status");

  if (insertError) {
    throw insertError;
  }

  const spots = (inserted ?? []) as InsertedSpot[];

  const historyRows = spots.flatMap((spot) => {
    const base = { spot_id: spot.id, note: "Seeded data" };

    if (spot.status === "pending") {
      return [{ ...base, from_status: null, to_status: "pending" }];
    }

    if (spot.status === "approved") {
      return [
        { ...base, from_status: null, to_status: "pending" },
        { ...base, from_status: "pending", to_status: "approved" }
      ];
    }

    if (spot.status === "cleanup_planned") {
      return [
        { ...base, from_status: null, to_status: "pending" },
        { ...base, from_status: "pending", to_status: "approved" },
        { ...base, from_status: "approved", to_status: "cleanup_planned" }
      ];
    }

    if (spot.status === "cleaned") {
      return [
        { ...base, from_status: null, to_status: "pending" },
        { ...base, from_status: "pending", to_status: "approved" },
        { ...base, from_status: "approved", to_status: "cleanup_planned" },
        { ...base, from_status: "cleanup_planned", to_status: "cleaned" }
      ];
    }

    return [{ ...base, from_status: null, to_status: spot.status }];
  });

  const { error: historyError } = await supabase
    .from("status_history")
    .insert(historyRows);

  if (historyError) {
    throw historyError;
  }

  let approvedPhotoCount = 0;
  let cleanedPhotoIndex = 0;

  const photoRows = spots.flatMap((spot) => {
    if (spot.status === "cleaned") {
      const beforeUrl =
        BEFORE_DEMO_PHOTOS[cleanedPhotoIndex % BEFORE_DEMO_PHOTOS.length];
      const afterUrl =
        AFTER_DEMO_PHOTOS[cleanedPhotoIndex % AFTER_DEMO_PHOTOS.length];

      cleanedPhotoIndex += 1;

      return [
        {
          spot_id: spot.id,
          type: "before",
          storage_path: beforeUrl.replace(/^\//, ""),
          public_url: beforeUrl
        },
        {
          spot_id: spot.id,
          type: "after",
          storage_path: afterUrl.replace(/^\//, ""),
          public_url: afterUrl
        }
      ];
    }

    if (spot.status === "approved" && approvedPhotoCount < 5) {
      const beforeUrl =
        BEFORE_DEMO_PHOTOS[approvedPhotoCount % BEFORE_DEMO_PHOTOS.length];

      approvedPhotoCount += 1;

      return [
        {
          spot_id: spot.id,
          type: "before",
          storage_path: beforeUrl.replace(/^\//, ""),
          public_url: beforeUrl
        }
      ];
    }

    return [];
  });

  if (photoRows.length > 0) {
    const { error: photosError } = await supabase
      .from("photos")
      .insert(photoRows);

    if (photosError) {
      throw photosError;
    }
  }

  console.log(`Seeded ${spots.length} spots and ${photoRows.length} photos.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
