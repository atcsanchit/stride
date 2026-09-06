---
track: ai-engineering
title: Production AI engineering — Peakflo to Berlin
---

# Production AI engineering

Two sources, one cadence.

**How to learn anything (Erin Meryl, Aug 2026 reel):** track what you are learning right now. Production, not consumption. Blurt before notes. Apply the same day. Revisit within 24 hours. Lower activation energy. Learn in public while it is still messy. Watching a lecture does not mark the day.

**The job bar (Shirin Khosravi Jam, jam.with.ai):** acronyms get you past the first question. Production is bottlenecks, latency, quality tradeoffs, failures, and systems that still work next week. You already ship voice agents, invoice OCR, evals, and finance/insurance workflows at Peakflo. Plus the gaps (LangGraph, LLMOps traces, GDPR, public proof) that the resume does not yet show.

Skip CS50P and “100 days of Python.” Ship small. GitHub is the resume. Each class has a practical. A sprint ticket tagged with an AI topic will not close until that evidence is pasted on complete.

Today’s tab runs a live week: Mon spark, Tue DSA apply, Wed AI ship, Thu whiteboard, Fri blurt, Sat public, Sun interest trail.

## How to learn anything
- [ ] Ask “what am I learning right now?” and write it before you open a course
- [ ] Production, not consumption: one shipped artifact beats a watched lecture
- [ ] Blurt the topic for 10 minutes before opening notes, a paper, or a solution
- [ ] Revisit within 24 hours on Revise (forgetting curve; retrieve first)
- [ ] Apply the same day: run the lab, eval, or agent — do not reread the blog
- [ ] Lower activation energy: two minutes to open Lab or type one function when you do not want to start
- [ ] Track the sentence on Complete so you can follow the interest over weeks, not collect more classes
- [ ] Learn in public while it is messy: one README line or post, not a polished essay

## Flagship builds (this season)
- [ ] Traced invoice eval harness someone else can run
- [ ] Domain RAG (bills or papers) with a naive-vs-yours retrieval table
- [ ] One public “what I learned this week” post or gist

## How she would run this
- [ ] Read her 6-month plan once, then ignore Month 1 (Python) and treat Month 2 as a skim, not a course
- [ ] Rule: retrieval quality beats prompt cleverness — rewrite one Peakflo miss as a retrieval miss, not a prompt miss
- [ ] Rule: evals before prompt tricks — freeze a golden set before the next prompt “improvement”
- [ ] Rule: skip tutorial hell — one deep public repo beats ten certificates
- [ ] Map Inngest graphs you already run onto LangGraph language (state, node, checkpoint, human node)
- [ ] Name the scratchpad you shipped as working memory, then say what is still missing (episodic / semantic / prospective)

## Courses she actually assigned
Do these. Do not collect the rest of DeepLearning.AI.
- [ ] DeepLearning.AI: LangChain for LLM Application Development (Harrison Chase) — vocabulary she expects
- [ ] DeepLearning.AI: AI Agents in LangGraph — persistence, streaming, human-in-the-loop
- [ ] DeepLearning.AI: Long-Term Agentic Memory with LangGraph — maps onto your scratchpad work
- [ ] DeepLearning.AI: Building and Evaluating Advanced RAG — RAG triad: context, groundedness, answer
- [ ] DeepLearning.AI: Fine-Tuning Large Language Models — so you can say when Flan-T5 was the wrong tool
- [ ] DeepLearning.AI: Generative AI with LLMs (Coursera/AWS) — training vs tuning vs inference lifecycle
- [ ] Karpathy: Neural Nets Zero to Hero — one sitting, so you can talk transformers without waving
- [ ] Chip Huyen: Designing Machine Learning Systems — data, contracts, monitoring
- [ ] Chip Huyen: AI Engineering (2025) — foundation-model apps; she puts this in Month 6
- [ ] Hands-On Large Language Models (Alammar / Grootendorst) — embeddings → RAG → fine-tune
- [ ] Made With ML (Goku Mohandas) — the MLOps repo she links every time
- [ ] Fork and run jamwithai production-agentic-rag-course — her actual syllabus, not a blog
- [ ] Work three Nir Diamant notebooks (RAG_Techniques + one agent) — her Month 5 homework

## The first question only
- [ ] LLM in one sentence, and what it is not (not a database, not a workflow engine)
- [ ] RAG in one sentence: retrieve, then generate — ZS search was RAG before you had the word
- [ ] LoRA in one sentence: cheap adapters, not a new base model
- [ ] RLHF vs DPO: what the preference data is for, when you would not collect it at Peakflo
- [ ] Prompt vs RAG vs LoRA: pick one for a vendor-specific invoice field and say why the other two lose

## Finding bottlenecks
- [ ] Name TTFT, TPOT, and end-to-end, and which one a LiveKit turn actually feels
- [ ] Prefill is compute-bound, decode is memory-bound — pick the right lever
- [ ] Split a Peakflo bill: retrieval vs generation vs HITL wait vs GCS fetch
- [ ] Split a voice turn: STT vs LLM vs TTS vs tool I/O vs transfer-call
- [ ] Trace one request with tenant, document, model, and prompt version
- [ ] Spot a blocking call on an async FastAPI/LiveKit server before you buy a bigger GPU

## Reducing latency
- [ ] Prefix / prompt cache for the static system prompt and repeated RAG preamble
- [ ] Route: cheap model default, expensive fallback only when the cheap one fails the schema
- [ ] Retrieve fewer chunks; rerank instead of stuffing (ZS 50% retrieval-time story, retold with numbers)
- [ ] Stream or constrain JSON instead of waiting on a novel
- [ ] Hold a voice turn under a 1.4s p95 budget, with a number not a vibe
- [ ] Queue 300-page OCR off the request path; do not make the user wait on it

## Quality, cost, and latency tradeoffs
- [ ] Put accuracy, p95, and $ / document on the same dashboard (your A/B evals, grown up)
- [ ] Design an STP cutoff: 91% is a product number, not a model screenshot
- [ ] When RAG beats LoRA for changing vendor layouts — and the reverse
- [ ] Temperature, cache, and “smarter model” as three different knobs
- [ ] Human-in-the-loop as a latency and cost choice, not a moral one
- [ ] Denial of wallet: RPM vs TPM, tenant caps, circuit-break a runaway agent

## Handling failures
- [ ] Empty retrieval, conflicting chunks, lost-in-the-middle
- [ ] Schema drift and a tool that times out mid-graph
- [ ] Silent OCR miss: the bill looks “done” and the field is wrong
- [ ] Timeouts, retries, and writes that must not double-create
- [ ] Circuit breaker plus a human approval node
- [ ] Write the incident: what you would detect next time, with the log line

## Retrieval quality over prompt cleverness
- [ ] Chunking for invoices vs emails vs clinical PDFs (ZS + Peakflo, same skill)
- [ ] Hybrid search: keyword + vector, with tenant/document metadata filters
- [ ] Embeddings: when to re-embed, how you version the index
- [ ] Citation and quote-faithfulness — the bill total must come from a span
- [ ] Run sentence-window or auto-merge retrieval on a 20-invoice sample and beat naive chunking
- [ ] Rebuild the website-chatbot project as a traced RAG service, not a notebook

## Agents, memory, and orchestration
- [ ] Single-agent tool loop with a hard step budget
- [ ] LangGraph: state, node, checkpoint, interrupt — then say how Inngest already is this
- [ ] MCP vs API vs function calling: pick one for “transfer call” and one for “fetch vendor master”
- [ ] Classify your scratchpad against her 7 memories: working, semantic, episodic, procedural, retrieval, parametric, prospective
- [ ] Add one memory type you do not have today (semantic facts per tenant, or prospective “remind me to call back”)
- [ ] Human approval as a first-class node; sub-workflows vs one giant graph
- [ ] Replay and resume after a failed step
- [ ] Build her Job Agent Part 1 (LangGraph + Opik) as the career-track side project — it hunts Berlin roles for you

## Proving it works
- [ ] Field-level accuracy on a versioned golden set (grow the 43 unit tests into evals, not just CI)
- [ ] Offline eval vs shadow traffic before a prompt promotion
- [ ] Slice metrics: vendor, locale, document type, insurance vs AP
- [ ] LLM-as-judge is a metric, not ground truth
- [ ] Trace every agent run in Opik or Langfuse: span tree, cost, prompt version
- [ ] Regression gate: cost and latency sit next to accuracy or you do not ship
- [ ] Her A/B testing post: five strategies, pick one you would use on an OCR prompt change

## Lab: document systems you already ship
- [ ] Type-aware routing for invoices, claims, credit notes
- [ ] Multi-page and scanned PDF strategies
- [ ] Line-item extraction and tax grouping
- [ ] Vendor master matching with a confidence threshold
- [ ] Straight-through vs HITL cutoff on a real sample set
- [ ] Entity extraction: retell the ZS 85/80 number as precision/recall, then say the failure class
- [ ] One-pager: the STP loop, with the silent miss you still would not catch

## Lab: voice systems you already ship
- [ ] STT / LLM / TTS matrix and a fallback when one vendor blips (Deepgram vs LiveKit path)
- [ ] Turn detection, interruption, multi-language — write the latency cost of each
- [ ] Date operations, transfer call, goal tracking: which belong in code vs the prompt
- [ ] Tool calls mid-call without blowing p95
- [ ] Post-call transcript to structured JSON
- [ ] Eval on transcripts and tool JSON, not “the call felt fine”
- [ ] Public write-up: scratchpad memory as working memory, with the 7-type gap analysis

## MLOps Berlin interviews expect
- [ ] Docker the FastAPI voice or OCR service; one command to run
- [ ] GitHub Actions: tests + a tiny eval job, not only lint (you already have Actions)
- [ ] Experiment tracking: MLflow or W&B for one prompt/model A/B
- [ ] Data and prompt contracts versioned like code
- [ ] Batch vs real-time serving: bills on a queue, voice on a WebSocket
- [ ] Skip Kubernetes for now (her roadmap says so) unless a job spec names it
- [ ] Read Agent Ops in the Real World once; sketch Peakflo onto that skeleton (queue, store, trace)

## EU-ready: GDPR, AI Act, regulated fintech
This is the new challenge. Berlin AI roles (her Scalable Capital world) fail you here before they fail you on LangGraph.
- [ ] GDPR in one page: lawful basis, purpose limitation, data minimisation, retention, DSAR
- [ ] Tenant isolation as a privacy control, not only a product feature
- [ ] What you would log for an invoice vs what you must not put in a prompt (PII, full IBAN)
- [ ] Right to erasure vs “the embedding is still in the index”
- [ ] EU AI Act: is an invoice OCR or collections voice agent limited/high-risk in your telling, and why
- [ ] Finance/insurance POCs: say “regulated workflow” with an eval gate, not “we used GPT”
- [ ] Red-team one Peakflo flow: jailbreak, prompt injection via PDF text, cross-tenant leak

## Germany career track
Not legal advice. Use the official portals. The play is: English-first Berlin AI Eng/ML Eng, Blue Card via a job offer, public proof that looks like hers.
- [ ] Read Make it in Germany: EU Blue Card — degree + qualified job + salary threshold (check the live number, do not memorise a blog)
- [ ] Look up IIIT Una in Anabin so you can answer “is the degree recognised?” without freezing
- [ ] Target shape: AI Engineer / ML Engineer on RAG, agents, document AI, or voice — not “data scientist who took a Coursera”
- [ ] Rewrite the intern bullets in Chip Huyen / jam.with.ai language: bottleneck, metric, lever, failure
- [ ] One public repo: observable agent (JobVis-style) or traced invoice eval harness — README in English a German hiring manager will skim
- [ ] Optional German A2 later; Berlin AI teams hire in English. Do not hide behind a language course
- [ ] Follow her instruction: build in public — one post per bottleneck you actually fixed

## Write it like production
- [ ] Public write-up: a bottleneck you found and the lever that moved p95
- [ ] Public write-up: agentic OCR quality loop
- [ ] Public write-up: voice agent latency + scratchpad memory
- [ ] Tiny eval harness on a sample invoice set, with Opik or Langfuse traces in the README
- [ ] System-design one-pager for a tenant-aware, GDPR-aware RAG service
- [ ] Mock: explain a production miss, the metric, and the fix — 12 minutes, no slides
