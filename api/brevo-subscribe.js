import { subscribeBrevoContact } from "./_brevo.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ success: false, error: "Method not allowed." });
  }

  try {
    const payload =
      typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
    const result = await subscribeBrevoContact(process.env.BREVO_API_KEY, payload);

    return response.status(200).json({
      success: true,
      listId: 2,
      brevoStatus: result.status,
      brevoResponse: result.body,
    });
  } catch (error) {
    console.error("[Brevo subscribe] Subscription failed:", error);
    return response.status(error.status || 502).json({
      success: false,
      error: error.message,
      details: error.details || null,
    });
  }
}
