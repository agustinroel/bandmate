import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      role?: string;
      claims: Record<string, unknown>;
    };
  }
}
