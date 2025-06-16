import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config.js";
import { getAuthorizationUrl } from "../utils/oauth.js";
import { randomBytes } from "crypto";

/**
 * Registers the authentication initiation route (`/auth`).
 * This route is responsible for starting the GitHub OAuth 2.0 flow.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function authRoutes(server: FastifyInstance) {
  /**
   * GET /auth
   * Initiates the GitHub OAuth 2.0 authorization flow.
   * 1. Generates a random 'state' parameter for CSRF protection.
   * 2. Stores this 'state' in a signed, HTTP-only cookie with properties:
   *    - `path: "/"`: Cookie is accessible on all paths.
   *    - `httpOnly: true`: Prevents client-side JavaScript access, mitigating XSS.
   *    - `secure: true` (in production): Cookie is sent only over HTTPS.
   *    - `signed: true`: Cookie value is signed to prevent tampering.
   *    - `maxAge: 300` (5 minutes): Cookie expires after a short period.
   *    - `sameSite: "lax"`: Provides a balance of CSRF protection and usability.
   * 3. Constructs the GitHub authorization URL including the 'state'.
   * 4. Redirects the user's browser to this GitHub URL.
   * If any error occurs, it logs the error and redirects the user to the `/error`
   * page with an appropriate error message and the frontend origin.
   */
  server.get("/auth", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const state = randomBytes(16).toString("hex");

      reply.setCookie("oauth_state", state, {
        path: "/",
        httpOnly: true,
        secure: config.nodeEnv === "production",
        signed: true,
        maxAge: 300, // 5 minutes
        sameSite: "lax",
      });

      const authorizationUrl = getAuthorizationUrl(state);
      server.log.info(
        `Redirecting to GitHub for authorization. State: ${state}`,
      );
      reply.redirect(authorizationUrl);
    } catch (error: unknown) {
      const errorMessage = "Failed to initiate authentication.";
      if (error instanceof Error) {
        server.log.error(
          { error: error.message, stack: error.stack },
          "Error in /auth route",
        );
      } else {
        server.log.error({ error }, "An unknown error occurred in /auth route");
      }

      const errorParams = new URLSearchParams({
        error: encodeURIComponent(errorMessage),
        origin: config.frontendUrl,
      });
      reply.redirect(`/error?${errorParams.toString()}`);
    }
  });
}
