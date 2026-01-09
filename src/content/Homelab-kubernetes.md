---
title: "Multi-server HA Proxmox & Kubernetes Cluster as an Operations Playground"
date: "2026-01-06"
tag: "Infrastructure"
icon: "🔬"
excerpt: "Configuring distributed systems across network, compute, and app layers"
---

## Kubernetes in a Homelab: Multi-VM Cluster as an Operations Playground

After getting stable Proxmox server infrastructure, I built a Kubernetes cluster on top of it using multiple KVM nodes. The point wasn’t “Kubernetes because it’s trendy”; the point was to force myself into the operational realities that teams actually deal with.

### Why VM-based Kubernetes is useful

- Node lifecycle is real: you can recreate nodes, resize them, replace them, snapshot, and break them safely
- Scheduling is visible: CPU/memory requests and limits matter immediately
- Failure modes are educational: a bad config or certificate issue becomes a controlled incident you can learn from

### The components that matter in practice

A working cluster is less about “kubectl works” and more about the supporting systems around it:

- **Ingress and routing:** exposing services consistently (hostnames, paths, TLS)
- **Certificate automation:** making HTTPS the default without manual renewals
- **Storage:** figuring out what is actually persistent and how it survives node changes
- **Secrets/config separation:** keeping deployments reproducible and reducing manual “snowflake” edits
- **Upgrades and rollbacks:** having a process, not hero debugging

### My operating focus

- Treating cluster changes as controlled: small diffs, observable outcomes
- Ensuring services remain reachable through a stable ingress path
- Keeping an eye on the boring constraints: disk IO pressure, memory pressure, noisy neighbors, and restart behavior

### The takeaway

- Comfort operating a multi-node environment (not just single-host Docker)
- Understanding of ingress/TLS/storage as first-class operational concerns
- Experience debugging distributed system failures across network, compute, and app layers
