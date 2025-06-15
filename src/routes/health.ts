import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

/**
 * Registers the health check route (`/health`).
 * This route provides a simple endpoint to verify that the application is running.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function healthRoutes(server: FastifyInstance) {
  /**
   * GET /health
   * Responds with the current application status and timestamp.
   * This is typically used by monitoring services to check application liveness.
   *
   * @returns {object} An object containing the status (e.g., "ok") and the current ISO timestamp.
   */
  server.get(
    "/health",
    async (request: FastifyRequest, reply: FastifyReply) => {
      server.log.info("Health check endpoint hit.");
      return reply.send({ status: "ok", timestamp: new Date().toISOString() });
    },
  );
}
