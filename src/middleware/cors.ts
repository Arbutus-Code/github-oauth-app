import { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import { config } from "../config.js";

/**
 * Configures CORS (Cross-Origin Resource Sharing) for the Fastify server.
 *
 * If `FRONTEND_URL` is set, it's used as the sole allowed origin.
 * If `FRONTEND_URL` is not set:
 *   - In production, CORS is effectively disabled (`origin: false`) to prevent
 *     accidental open CORS policies. An error is logged.
 *   - In non-production environments, CORS defaults to reflecting the request's
 *     Origin header (`origin: true`) for development flexibility. A warning is logged.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function corsPlugin(server: FastifyInstance) {
  let effectiveOriginConfig: string[] | boolean;
  let allowedOriginsDisplay: string;

  if (config.frontendUrl) {
    effectiveOriginConfig = [config.frontendUrl];
    allowedOriginsDisplay = config.frontendUrl;
  } else {
    if (config.nodeEnv === "production") {
      server.log.error(
        "CRITICAL: FRONTEND_URL is not set in production. CORS will be disabled (origin: false) to prevent open CORS policies. Frontend requests will likely fail.",
      );
      effectiveOriginConfig = false;
      allowedOriginsDisplay =
        "None (FRONTEND_URL not set in production - CORS disabled)";
    } else {
      server.log.warn(
        "FRONTEND_URL not set in non-production environment. CORS will reflect request origin (origin: true). Ensure this is intended for your development setup.",
      );
      effectiveOriginConfig = true;
      allowedOriginsDisplay =
        "Any (FRONTEND_URL not set in non-production, reflecting request origin)";
    }
  }

  server.register(fastifyCors, {
    origin: effectiveOriginConfig,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  server.log.info(
    `CORS configured. Allowed origins: ${allowedOriginsDisplay}. Methods: GET, POST, OPTIONS. Credentials: true.`,
  );
}
