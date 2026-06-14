const BREVO_API_BASE = "https://api.brevo.com/v3";
const BREVO_LIST_ID = 2;
const BREVO_FORM_ACTION =
  "https://0957a9d3.sibforms.com/serve/MUIFAAlAup__toNa2VdD4564PbJ_UKa3WkTv0_kD3Wqi2a9_4LhocwNYP_39tWw12kSSXpi8vx1AtkZV2eiGuSQGgPfFO-28qggSJfh3z0vAfXmjo54kfCepNc-xZEdwaFDz2UQj9E-Rhq2UM7D1AO2qCpC6CYz9OZ6JSklfJndc01emHNINyrtdwhKOjfbUTNpsp6OdogvThtcznQ==";

function requireApiKey(apiKey) {
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }
}

function validateSubscriptionPayload(payload) {
  const requiredFields = ["PRENOM", "EMAIL", "SMS", "SMS__COUNTRY_CODE"];
  const isValid = requiredFields.every(
    (field) => typeof payload?.[field] === "string" && payload[field].trim(),
  );

  if (!isValid) {
    const error = new Error("Missing required subscription fields.");
    error.status = 400;
    throw error;
  }
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function getBrevoContactCount(apiKey) {
  requireApiKey(apiKey);

  const response = await fetch(
    `${BREVO_API_BASE}/contacts/lists/${BREVO_LIST_ID}/contacts?limit=1&offset=0`,
    {
      headers: {
        accept: "application/json",
        "api-key": apiKey,
      },
    },
  );
  const body = await parseResponse(response);

  if (!response.ok || !Number.isFinite(body?.count)) {
    throw new Error(body?.message || `Brevo count request failed with status ${response.status}.`);
  }

  return body.count;
}

async function validateWithBrevoForm(payload) {
  const formData = new FormData();
  formData.set("PRENOM", payload.PRENOM);
  formData.set("EMAIL", payload.EMAIL);
  formData.set("SMS", payload.SMS);
  formData.set("SMS__COUNTRY_CODE", payload.SMS__COUNTRY_CODE);
  formData.set("email_address_check", "");
  formData.set("locale", "fr");
  formData.set("g-recaptcha-response", payload.captchaResponse || "");

  const response = await fetch(`${BREVO_FORM_ACTION}?isAjax=1`, {
    method: "POST",
    body: formData,
  });
  const body = await parseResponse(response);

  if (!response.ok || body?.success !== true) {
    const error = new Error(body?.message || "Brevo form validation failed.");
    error.status = response.status;
    error.details = body;
    throw error;
  }
}

async function addContactToWaitingList(apiKey, payload) {
  requireApiKey(apiKey);

  const response = await fetch(`${BREVO_API_BASE}/contacts`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: payload.EMAIL,
      attributes: {
        PRENOM: payload.PRENOM,
        SMS: `${payload.SMS__COUNTRY_CODE}${payload.SMS}`,
      },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    }),
  });
  const body = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(body?.message || `Brevo contact request failed with status ${response.status}.`);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return {
    status: response.status,
    body,
  };
}

export async function subscribeBrevoContact(apiKey, payload, options = {}) {
  validateSubscriptionPayload(payload);

  if (!options.skipCaptchaValidation) {
    await validateWithBrevoForm(payload);
  }

  return addContactToWaitingList(apiKey, payload);
}

export function getFallbackCount(value) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}
