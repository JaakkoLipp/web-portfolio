# 2026-10-08: Deploy access and VPS privacy

Status: The owner asked to set up the deploy to the VPS and to keep VPS details out of the public repo. The rest is Claude's call. The owner can overturn it.

| Question | Old default | Answer | Reason |
| --- | --- | --- | --- |
| VPS details in the repo | `docs/deploy.md` named the web server, the proxy, paths and its config | None. The server setup is documented on the server | Owner request. The repo is public. |
| Deploy login | A key with a full shell on the server | A dedicated deploy user and key. The key can only upload a release and run `activate` | A leaked CI key cannot open a shell or touch anything else. |
| Host key | `ssh-keyscan` on every run | Pinned in the `VPS_KNOWN_HOSTS` secret | Blocks a man-in-the-middle on first contact. |
| SSH agent action | `webfactory/ssh-agent` | Plain shell in the workflow | One less third-party action that handles the private key. |
| Rollback | Symlink commands on the server | Re-run an older green Deploy run in Actions | No server access or server paths needed. |
