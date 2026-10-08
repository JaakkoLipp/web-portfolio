# Deploy

## How it works

`.github/workflows/deploy.yml` runs on every push to `main`, or by hand from the Actions tab (main only).

1. Build and run the checks.
2. Write the commit SHA to `dist/version.txt`.
3. Upload `dist/` over SSH as a new release.
4. Run `activate <release>` on the server. It switches the live site to the new release in one atomic step and keeps the last 5.
5. Fetch `https://jaalip.com/version.txt` and fail unless it returns the new SHA.

Step 5 checks the whole path a visitor takes: DNS, TLS certificate, routing and the switch.
A green run means the new release is live.

## Secrets

| Name | Value |
| --- | --- |
| `VPS_HOST` | Server address |
| `VPS_PORT` | SSH port |
| `VPS_USER` | The deploy user |
| `VPS_SSH_KEY` | Private key of the deploy user |
| `VPS_KNOWN_HOSTS` | The server's host keys, in `known_hosts` format. SSH refuses any other server |

Optional repository variable: `SITE_URL` (defaults to `https://jaalip.com`).

The deploy key can only upload a release and activate it. It cannot open a shell.

## Server setup

The server side is documented on the server, not in this public repo.

## Roll back

In the Actions tab, open an older green Deploy run and choose "Re-run all jobs".
It rebuilds that commit and makes it live. GitHub allows re-runs for 30 days.
