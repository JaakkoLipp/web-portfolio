# Deploy

## How it works

`.github/workflows/deploy.yml` runs on every push to `main`, or by hand from the Actions tab (main only).

1. Build and run the checks.
2. Write the commit SHA to `dist/version.txt`.
3. rsync `dist/` to `/var/www/portfolio/releases/<time>-<sha>/` on the VPS.
4. Point the `/var/www/portfolio/current` symlink at the new release. Keep the last 5.
5. Fetch `https://jaalip.com/version.txt` and fail unless it returns the new SHA.

Step 5 checks the whole path a visitor takes: DNS, TLS certificate, routing and the symlink.
A green run means the new release is live.

Repository secrets: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`.
Optional repository variable: `SITE_URL` (defaults to `https://jaalip.com`).

## Rollback

```bash
ls -1dt /var/www/portfolio/releases/*        # newest first
ln -sfn /var/www/portfolio/releases/<previous> /var/www/portfolio/current
```

## Known issue (checked 2026-10-08)

The last deploy run (2026-01-13) succeeded, and nothing was pushed to `main` after it.
The workflow is not the problem. The web server is:

- `jaalip.com` and `www.jaalip.com` resolve to the VPS.
- HTTPS there answers with `TRAEFIK DEFAULT CERT`, a self-signed certificate created 2026-09-29.
- HTTP there answers with a Traefik `404 Not Found`.

So Traefik (probably Pangolin's) now owns ports 80 and 443 and has no router for jaalip.com.
A deploy still uploads files and switches the symlink, but nothing serves that folder to visitors.
With the check in step 5, the deploy now fails until this is fixed.

## Fix: route jaalip.com through Traefik

Traefik needs two things: a small web server that serves `/var/www/portfolio/current`, and a router for the domain with a certificate.
The example below runs nginx next to Traefik. Names in it are examples. Match them to your setup.

**1. A static file server on Traefik's Docker network.** Mount the whole `/var/www/portfolio` at the same path, so the absolute `current` symlink still resolves inside the container.

```yaml
# docker-compose.yml, next to Pangolin
services:
  jaalip-web:
    image: nginx:1.29-alpine
    restart: unless-stopped
    volumes:
      - /var/www/portfolio:/var/www/portfolio:ro
      - ./jaalip-nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks: [pangolin]

networks:
  pangolin:
    external: true   # the network Traefik is on. Check with: docker network ls
```

```nginx
# jaalip-nginx.conf
server {
  listen 80;
  root /var/www/portfolio/current;
  error_page 404 /404.html;
  location /_astro/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location = /version.txt { add_header Cache-Control "no-store"; }
}
```

**2. A router for the domain.** Either add a resource for `jaalip.com` in the Pangolin dashboard that targets `http://jaalip-web:80`, or add a Traefik dynamic config file:

```yaml
http:
  routers:
    jaalip:
      rule: "Host(`jaalip.com`) || Host(`www.jaalip.com`)"
      entryPoints: [websecure]          # your HTTPS entrypoint name
      service: jaalip
      tls:
        certResolver: letsencrypt       # your ACME resolver name
  services:
    jaalip:
      loadBalancer:
        servers:
          - url: "http://jaalip-web:80"
```

**3. Check it.**

```bash
curl -sS https://jaalip.com/ -o /dev/null -w '%{http_code}\n'   # 200, no certificate error
```

Then run the deploy workflow by hand. It turns green once the site serves the new release.
