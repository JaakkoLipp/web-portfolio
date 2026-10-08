---
title: LLM evaluation service
summary: Kafka-native service that scores LLM and RAG output as events flow through the pipeline.
date: 2026-05-31 # TODO: confirm. Thesis due spring 2026.
context: Master's thesis, LUT University, with Telia Finland
stack: [Python, Kafka, DeepEval]
log: Kafka-native LLM evaluation service (LUT x Telia)
order: 1
---

A developer-facing backend service that makes LLM features measurable.
It evaluates model output for groundedness and faithfulness, tracks regressions between versions, and plugs into real systems as a modular, scalable service.

I built it for my master's thesis in software engineering at LUT University, together with Telia Finland.

## Why

LLMs fail in ways classic software rarely does.
A change that improves one prompt can degrade another.
A model update can change tone, detail or refusal behavior.
Without evaluation you end up debugging vibes.

## What it checks

- Is the answer grounded in the provided context?
- Did retrieval fetch the sources it should have?
- Is the answer complete for the question?
- Does behavior stay consistent across model and prompt versions?

## How it works

[TODO: architecture, topics and how teams integrate it]

## Results

[TODO: thesis results and a link to the thesis or a write-up]
