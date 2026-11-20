# Scaling and load balancing

The NestJS API is designed to run as multiple stateless instances. Authentication is token-based, durable application state is stored in PostgreSQL, and dictionary cache, pending quiz answer keys, and throttler counters use Redis. Production startup requires `REDIS_URL`. `main.ts` enables graceful shutdown and configures Express `trust proxy` from `TRUST_PROXY_HOPS` so client IP and HTTPS information are read from the trusted proxy chain.

## Nginx example

`deploy/nginx.conf` is a starting point for two API processes listening on ports 4001 and 4002 on the same host. Change the upstream addresses, host name, TLS termination, and limits for the deployment. Use a managed load balancer or ingress controller when running in containers or Kubernetes. Health check `/api/health` before routing traffic, drain a target before stopping it, and set `TRUST_PROXY_HOPS` to the exact number of trusted proxies in front of the NestJS process. Do not trust arbitrary client-supplied `X-Forwarded-*` headers.

## Shared-state requirements as traffic grows

When Redis is unreachable after startup, the API logs the failure. Dictionary reads can fall back to the process cache, while quiz state may become unavailable until Redis recovers; the answer key is never sent to clients as a fallback. The throttler has a local fallback during Redis outages, so the effective rate limit can temporarily differ across API instances. Keep the Nginx limit enabled as an additional edge control. Multiple Nginx replicas need a load balancer or shared rate-limit backend in front of them. Monitor Redis availability and PostgreSQL connection pool usage. Do not persist third-party dictionary data beyond the provider's license terms.

For production, terminate TLS at the trusted edge, restrict direct access to application ports, configure database pool limits per API instance, and make readiness checks verify dependencies required to serve requests. Set `TRUST_PROXY_HOPS=0` if the API is exposed directly without a reverse proxy.
