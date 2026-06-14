import { getBrevoContactCount, getFallbackCount } from "./_brevo.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const fallbackCount = getFallbackCount(process.env.BREVO_CONTACTS_FALLBACK);
  const forceRefresh = request.query?.refresh === "1";

  response.setHeader(
    "Cache-Control",
    forceRefresh ? "no-store" : "s-maxage=60, stale-while-revalidate=300",
  );

  try {
    const brevoContacts = await getBrevoContactCount(process.env.BREVO_API_KEY);
    return response.status(200).json({
      brevoContacts,
      fallback: false,
      listId: 2,
    });
  } catch (error) {
    console.error("[Brevo count] Falling back after API error:", error);
    return response.status(200).json({
      brevoContacts: fallbackCount,
      fallback: true,
      listId: 2,
    });
  }
}

