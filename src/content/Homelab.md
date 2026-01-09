---
title: "My Self-hosting Homelab Architecture: Edge VPS + Two-Node Proxmox Core"
date: "2026-01-02"
tag: "Infrastructure"
icon: "📝"
excerpt: "Edge VPS + Two-Node Proxmox Core"
---

## My Self-hosting Homelab Architecture: Edge VPS + Two-Node Proxmox Core

I run a small but realistic home infrastructure that mirrors common production patterns: a hardened public edge, private compute, and controlled exposure of services.

### High-level layout (intentionally simplified)

- **Public edge:** a VPS acting as the single internet-facing entry point
- **Private core:** a two-node Proxmox environment hosting VMs/containers
- **Secure link:** a site-to-site wireguard tunnel between the VPS and the home network to avoid exposing internal management planes

This design keeps the blast radius small: the public VPS terminates inbound traffic and routes only what’s necessary to internal services.

### What the VPS does (edge responsibilities)

- Reverse proxying multiple internal services behind one public IP
- TLS termination with automated certificates
- Firewalling and explicit allowlists for inbound ports
- Routing traffic over the tunnel to the correct internal target (VM or service)

Operationally, this forces good habits: DNS + TLS automation, least-privilege exposure, and clean separation between “internet edge” and “compute layer”.

### What Proxmox does (compute responsibilities)

- Running isolated workloads as VMs/containers (services, game servers, experiments)
- Keeping workloads separated by purpose (infrastructure vs apps vs test)
- Managing resources and scheduling with real constraints (CPU/RAM/storage/IO contention)

Two nodes is enough to surface real-world issues (maintenance windows, migration planning, single points of failure) without hiding complexity behind a managed platform.

### The takeaway

- Practical network boundary design (edge vs core)
- Secure remote access patterns without exposing internal admin surfaces
- Real service publishing: DNS → TLS → proxy → internal routing
- Day-2 operations mindset: upgrades, break/fix, and repeatability
