import { FastifyInstance, FastifyRequest } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import { config } from "../config.js";

/**
 * Configures rate limiting for the Fastify server.
 * Rate limiting is disabled if `NODE_ENV` is 'test'.
 * Uses settings from the application config for `max` requests and `timeWindow`.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function rateLimitPlugin(server: FastifyInstance) {
  if (config.nodeEnv !== "test") {
    server.register(fastifyRateLimit, {
      max: config.rateLimit.requests,
      timeWindow: config.rateLimit.windowMinutes * 60 * 1000,
      onExceeded: (req: FastifyRequest, key: string) => {
        server.log.warn(
          { ip: req.ip, key },
          `Rate limit exceeded for IP: ${req.ip}`,
        );
      },
    });
    server.log.info(
      `Rate limiting enabled: ${config.rateLimit.requests} requests per ${config.rateLimit.windowMinutes} minutes.`,
    );
  } else {
    server.log.info("Rate limiting disabled for test environment.");
  }
}
