type NotifyAdminNewSpotOptions = {
  spotId: string;
  title: string;
  ward: string;
  severity: string;
  siteUrl: string;
};

function getFromAddress(siteUrl: string) {
  try {
    const hostname = new URL(siteUrl).hostname;

    if (hostname && hostname !== "localhost") {
      return `CleanMap Hyderabad <noreply@${hostname}>`;
    }
  } catch {
    // Fall through to the default production sender.
  }

  return "CleanMap Hyderabad <noreply@cleanmap-hyderabad.vercel.app>";
}

export async function notifyAdminNewSpot({
  spotId,
  title,
  ward,
  severity,
  siteUrl
}: NotifyAdminNewSpotOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: getFromAddress(process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl),
      to: adminEmail,
      subject: `New report: ${title} — ${ward}`,
      text: `A new garbage spot has been reported on CleanMap Hyderabad.

Title: ${title}
Ward: ${ward}
Severity: ${severity}

Review it: ${siteUrl}/admin/spots/${spotId}`
    })
  });

  if (!response.ok) {
    throw new Error("Admin notification failed");
  }
}
