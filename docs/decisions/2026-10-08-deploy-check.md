# 2026-10-08: The deploy proves the site is live

Status: Claude's call, after the owner asked whether the autodeploy still works. The owner can overturn it.

| Question | Old default | Answer | Reason |
| --- | --- | --- | --- |
| When is a deploy green | When rsync and the symlink switch succeed | Only when `https://jaalip.com/version.txt` returns the new commit SHA, with a valid TLS certificate | The last deploy was green while visitors could not reach the site. The web server had stopped routing the domain. |
| Manual deploys | Push to `main` only | Also `workflow_dispatch`, guarded to `main` | Test the pipeline without an empty commit. |
| Live URL | Hard-coded | `SITE_URL` repository variable, default `https://jaalip.com` | One place to change it. |
