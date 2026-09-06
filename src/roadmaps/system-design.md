---
track: system-design
title: System design for ML engineers
---

# System design for ML engineers

Learn the generic distributed-systems vocabulary first, then spend real time on ML systems — that is the interview you will actually get, and the work already on the resume.

**How to learn anything:** reading Hello Interview is familiarity. Learning is the whiteboard you can wipe. Twenty minutes from memory, then compare. Thursday on Today is that event.

## How to learn anything (session)
- [ ] Whiteboard from memory before opening a reference solution
- [ ] Restate, API, data model, bottleneck, one tradeoff — then wipe and redo once
- [ ] Time a 12-minute talk with no slides the same day you study the topic
- [ ] Log the sentence: what you learned, not which video you watched
- [ ] Revisit the sketch within 24 hours on Revise

## Foundations
- [ ] Latency vs throughput, p50/p95/p99
- [ ] Availability, SLIs, SLOs, error budgets
- [ ] CAP and PACELC in plain language
- [ ] Load balancing: L4 vs L7, health checks
- [ ] Caching: CDN, Redis, write-through vs write-back, stampede
- [ ] Database choice: SQL vs NoSQL, when each fails
- [ ] Indexes, partitioning, sharding strategies
- [ ] Replication: sync vs async, leader election
- [ ] Consistent hashing
- [ ] Queues and pub/sub: at-least-once vs exactly-once
- [ ] Idempotency keys for APIs and consumers
- [ ] Rate limiting: token bucket, leaky bucket
- [ ] Backpressure and retry with jitter
- [ ] Object storage vs block vs file
- [ ] CDN and geo-routing

## Core interview drills
- [ ] URL shortener
- [ ] News feed
- [ ] Chat / messaging
- [ ] Rate limiter
- [ ] Unique ID generator
- [ ] Web crawler
- [ ] Notification system
- [ ] Search autocomplete
- [ ] Video streaming at a high level
- [ ] Ride sharing matching at a high level

## Data and storage design
- [ ] Design a time-series metrics store
- [ ] Design an analytics event pipeline
- [ ] WAL, snapshots, and recovery
- [ ] CDC from OLTP to warehouse
- [ ] Blob store for PDFs and audio (you already ship this)

## ML and document systems
- [ ] Design an OCR / IDP pipeline for invoices
- [ ] Multi-tenant document queue with retries and DLQ
- [ ] Human-in-the-loop review queue
- [ ] Vendor matching / entity resolution service
- [ ] Feature store: online vs offline, point-in-time correctness
- [ ] RAG system: chunking, embeddings, retrieval, citations
- [ ] Agent orchestration with tool calls and step limits
- [ ] Voice agent: STT → LLM → TTS, turn detection, interruption
- [ ] Eval harness and shadow traffic for a new model
- [ ] Prompt and workflow versioning per tenant
- [ ] Cost controls: caching, model routing, batch vs realtime

## Reliability and operations
- [ ] Observability: traces, structured logs, golden signals
- [ ] Circuit breakers and multi-provider fallback
- [ ] Multi-region active-passive vs active-active
- [ ] Secrets, tenant isolation, PII in documents
- [ ] Capacity planning from 7k docs/month upward

## How to answer
- [ ] 60-second problem restatement and constraints
- [ ] API sketch before boxes
- [ ] Data model before scale math
- [ ] Bottleneck, then the one tradeoff you would actually ship
- [ ] Timed 45-minute mock: OCR pipeline
- [ ] Timed 45-minute mock: voice agent
- [ ] Timed 45-minute mock: generic (chat or feed)
