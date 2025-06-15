/**
 * Main application entry point.
 * Initializes the Fastify server, registers middleware and routes, and starts the server.
 */
import Fastify, { FastifyInstance } from "fastify";
import { config } from "./config.js";
import corsPlugin from "./middleware/cors.js";
import rateLimitPlugin from "./middleware/rateLimit.js";
import fastifyCookie from "@fastify/cookie";
import authRoutes from "./routes/auth.js";
import callbackRoutes from "./routes/callback.js";
import successRoutes from "./routes/success.js";
import errorRoutes from "./routes/error.js";
import healthRoutes from "./routes/health.js";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";

const server: FastifyInstance = Fastify({
  logger: {
    level: config.logLevel,
    transport:
      config.nodeEnv === "development"
        ? {
            target: "pino-pretty", // Pretty print logs in development
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          }
        : undefined, // Use default JSON output in production
  },
});

// Replicate __dirname and __filename behavior for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.register(fastifyCookie, {
  secret: config.sessionSecret,
});

server.register(corsPlugin);
server.register(rateLimitPlugin);

server.register(fastifyStatic, {
  root: path.join(__dirname, "views"),
});

server.register(authRoutes);
server.register(callbackRoutes);
server.register(successRoutes);
server.register(errorRoutes);
server.register(healthRoutes);

/**
 * Starts the Fastify server on the configured port and host.
 * Exits the process if an error occurs during startup.
 */
const start = async () => {
  try {
    await server.listen({ port: config.port, host: config.host });
    server.log.info(`Server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
