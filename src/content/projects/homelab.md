---
title: Homelab
summary: Proxmox cluster with RTX 3090 passthrough that runs my self-hosted LLM stack.
date: 2026-01-02 # TODO: confirm
context: Personal infrastructure
stack: [Proxmox, KVM, Kubernetes, WireGuard, vLLM, Open WebUI, LiteLLM, Langfuse, SearXNG, n8n]
log: Proxmox cluster with RTX 3090 passthrough
order: 2
---

A small but realistic setup that mirrors common production patterns: a hardened public edge, private compute, and controlled exposure of services.

## Layout

- **Public edge:** a VPS (`netwatch`) is the only internet-facing entry point. It terminates TLS and routes traffic over WireGuard.
- **Private core:** a Proxmox cluster runs VMs and containers, separated by purpose.
- **GPU node:** an RTX 3090 with PCIe passthrough serves models through vLLM.
- **Private access:** Tailscale for admin access. Management planes are never exposed.

## What runs on it

vLLM, Open WebUI, LiteLLM, Langfuse, SearXNG and n8n.
A Kubernetes cluster on KVM nodes is the operations playground: ingress, certificates, storage, upgrades and rollbacks.

## Why

It forces good habits: DNS and TLS automation, least-privilege exposure, and a clean line between the internet edge and the compute layer.

[TODO: architecture diagram]
