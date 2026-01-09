## Portfolio improvements

### 1) Reframe the hero for DevOps

- Tagline: “I build and operate reliable infrastructure.”
- One-line proof under it: “Linux · Docker · Kubernetes (or Nomad) · Terraform · CI/CD · Observability”

### 2) Replace “Projects” with “Infrastructure”

Top nav: **About · Infrastructure · Blog**
Infrastructure page sections:

- Homelab / VPS topology diagram
- Provisioning (Terraform/Ansible)
- CI/CD pipeline overview
- Monitoring/alerts screenshots
- Runbooks (short, real)

### 3) Add “Operational evidence” blocks (the differentiator)

Each project card includes:

- SLO/uptime target
- Deployment method
- Rollback method
- Logs/metrics/traces stack
- Cost note (optional)
- “What broke” + fix summary

### 4) Publish 3 short DevOps posts (high signal)

- “Zero-downtime deploy for a static site + reverse proxy”
- “WireGuard hub-and-spoke: routing services safely”
- “Monitoring stack: metrics + logs + alerts in one place”

### 5) Add a public status/health endpoint

- `/status` page showing uptime, last deploy SHA, environment, basic health checks
- Even if it’s static, show deploy SHA and build time from CI.

### 6) Tighten content hierarchy

Home page should show:

- 2–3 Infrastructure/DevOps projects
- 1–3 recent posts
- Contact links
  Drop anything not supporting DevOps.

### 7) Add a “toolchain” footer line

Example: “Built with Astro · Deployed via CI · Served by Nginx · TLS via Let’s Encrypt”

## Next moves: CI/CD + hosting (recommended path)

### Hosting

- Static hosting behind your own reverse proxy: Nginx/Caddy on VPS
- Or: Cloudflare Pages + custom domain (fastest) but less “self-host DevOps” signal.

### CI/CD deliverables

- Build + test + lint
- Generate artifacts
- Deploy with atomic switch + cache headers
- Rollback (keep previous build directory)
- Add deploy metadata (SHA/build time) into the site
