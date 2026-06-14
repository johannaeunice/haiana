import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  getBrevoContactCount,
  getFallbackCount,
  subscribeBrevoContact,
} from "./api/_brevo.js";

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function brevoLocalApiPlugin({ apiKey, fallbackCount }) {
  return {
    name: "haiana-brevo-local-api",
    configureServer(server) {
      server.middlewares.use("/api/brevo-count", async (request, response) => {
        if (request.method !== "GET") {
          return sendJson(response, 405, { error: "Method not allowed." });
        }

        try {
          const brevoContacts = await getBrevoContactCount(apiKey);
          return sendJson(response, 200, { brevoContacts, fallback: false, listId: 2 });
        } catch (error) {
          console.error("[Brevo count] Local fallback after API error:", error);
          return sendJson(response, 200, {
            brevoContacts: fallbackCount,
            fallback: true,
            listId: 2,
          });
        }
      });

      server.middlewares.use("/api/brevo-subscribe", async (request, response) => {
        if (request.method !== "POST") {
          return sendJson(response, 405, { success: false, error: "Method not allowed." });
        }

        try {
          const payload = await readJsonBody(request);
          const result = await subscribeBrevoContact(apiKey, payload, {
            skipCaptchaValidation: true,
          });

          return sendJson(response, 200, {
            success: true,
            listId: 2,
            brevoStatus: result.status,
            brevoResponse: result.body,
          });
        } catch (error) {
          console.error("[Brevo subscribe] Local subscription failed:", error);
          return sendJson(response, error.status || 502, {
            success: false,
            error: error.message,
            details: error.details || null,
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      brevoLocalApiPlugin({
        apiKey: env.BREVO_API_KEY,
        fallbackCount: getFallbackCount(env.BREVO_CONTACTS_FALLBACK),
      }),
    ],
  };
});
