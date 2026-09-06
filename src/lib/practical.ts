import type { RoadmapItem, Ticket, TrackId } from '../types';
import { isChoreTicket, ticketTopics } from './ticket';

export const PRACTICAL_TRACKS: TrackId[] = ['dsa', 'system-design', 'ai-engineering'];

export type PracticalChallenge = {
	section: string;
	build: string;
	test: string;
	github: string;
	source: string;
	requireGithub?: boolean;
};

const SOURCE: Record<TrackId, string> = {
	dsa: 'Erin Meryl — How to learn anything: produce the solution, do not reread it first',
	'system-design': 'Erin Meryl — whiteboard first (impermanence), then apply like the interview',
	'ai-engineering': 'Erin Meryl session ritual + Shirin Khosravi Jam / jam.with.ai production bar',
};

const FALLBACK: Record<TrackId, Omit<PracticalChallenge, 'section' | 'source'>> = {
	dsa: {
		build: 'Blurt the pattern for 10 minutes, then solve one problem in Lab from a blank editor. No solution tab until you are stuck.',
		test: 'You can explain the approach without the editor. Time and space in one sentence.',
		github: 'Optional gist after you finish — never before.',
	},
	'system-design': {
		build: 'Twenty-minute whiteboard: restate, API, data model, bottleneck, one tradeoff you would ship. Wipe and redo once.',
		test: 'Talk it in 12 minutes with no slides. Name the failure mode.',
		github: 'Push a one-pager or a photo of the board after you wipe the first pass.',
	},
	'ai-engineering': {
		build: 'Ship a tiny artifact today (eval table, failing test, trace, or README number). Watching a lecture does not count.',
		test: 'A stranger can run it or argue with a number in the README.',
		github: 'Push the artifact. Ticket stays open without a github.com link.',
		requireGithub: true,
	},
};

const AI_CHALLENGES: Record<string, Omit<PracticalChallenge, 'section' | 'source'>> = {
	'how to learn anything': {
		build: 'Do one full session tonight: 10-minute blurt, then apply (code / whiteboard / eval), then one sentence of what you learned. Do not open notes first.',
		test: 'You have a messy blurt and a shipped artifact or solved problem from the same sitting.',
		github: 'Optional: gist the blurt or the sentence. The Complete note is the real log.',
		requireGithub: false,
	},
	'how to learn anything (session)': {
		build: 'Same ritual on this track: blurt, apply, log the sentence. Familiarizing (watching, rereading) is scheduled separately and does not mark the day.',
		test: 'The heatmap item was completed after production, not after a video.',
		github: 'Optional gist.',
		requireGithub: false,
	},
	'flagship builds (this season)': {
		build: 'Pick one: traced invoice eval harness, domain RAG with a retrieval table, or a public “what I learned” post. Finish a slice you can run.',
		test: 'README has a run command and a number or a failure.',
		github: 'Push the repo or gist.',
		requireGithub: true,
	},
	'how she would run this': {
		build: 'One page: how you will run the next 6 weeks (evals first, retrieval over prompts, one public repo). Map one Inngest graph you already ship onto LangGraph words (state, node, checkpoint, human node).',
		test: 'A stranger can read the page and say which Peakflo miss is a retrieval miss, not a prompt miss.',
		github: 'Push `notes/how-i-run-this.md` to a public repo.',
	},
	'courses she actually assigned': {
		build: 'Finish one assigned artifact (LangGraph short course notebook, Made With ML chapter, or fork of jamwithai production-agentic-rag-course) and write what you actually ran.',
		test: 'README lists the command that reproduces it and one thing you would change for Peakflo.',
		github: 'Push the notebook or fork plus a short `notes/course-artifact.md`.',
	},
	'the first question only': {
		build: 'One-page glossary: LLM, RAG, LoRA, RLHF vs DPO in one sentence each. Then pick prompt vs RAG vs LoRA for a vendor-specific invoice field and say why the other two lose.',
		test: 'You can say it out loud in under 3 minutes with no notes.',
		github: 'Push `notes/first-question.md`.',
	},
	'finding bottlenecks': {
		build: 'Trace one real path (bill or voice turn). Name TTFT, TPOT, end-to-end, and the stage that dominates. Include tenant / document / model if you can.',
		test: 'A table with at least three numbered stages and one lever you would try first.',
		github: 'Push `notes/bottleneck-trace.md` (redact PII). Optional: a sanitized trace screenshot.',
	},
	'reducing latency': {
		build: 'Ship one latency lever (prefix cache, cheap-model route, fewer chunks, or off-request OCR queue) and record before/after p95.',
		test: 'README has two numbers and the lever. No vibes.',
		github: 'Push a tiny harness or `notes/latency-lever.md` with the numbers.',
	},
	'quality, cost, and latency tradeoffs': {
		build: 'One dashboard sketch or markdown table: accuracy, p95, $ / document, and an STP cutoff. Say when RAG beats LoRA for changing layouts.',
		test: 'Someone can argue with your cutoff because the numbers are written down.',
		github: 'Push `notes/quality-cost-latency.md`.',
	},
	'handling failures': {
		build: 'Write the incident for one failure class (empty retrieval, silent OCR miss, double-create, or tool timeout). Add one test or checklist that would catch it next time.',
		test: 'The write-up has detect / mitigate / prevent. The test fails on the bad case.',
		github: 'Push `notes/incident.md` and the test (or a fixture + assert).',
	},
	'retrieval quality over prompt cleverness': {
		build: 'Mini RAG on a small sample (invoices or public PDFs). Compare naive chunking vs one better strategy. Citations must come from a span.',
		test: 'A 20-doc (or smaller) table: naive vs yours on at least one retrieval metric.',
		github: 'Push the service or notebook plus README with the table and how to run it.',
	},
	'agents, memory, and orchestration': {
		build: 'A small agent with a hard step budget and a human/approval node. Map it to Inngest if you already have the graph. Optional: Job Agent slice (LangGraph + traces).',
		test: 'Replay or resume after a failed step works. README says which of the 7 memories you implemented.',
		github: 'Push the graph plus `notes/agent-memory.md`.',
	},
	'proving it works': {
		build: 'A versioned golden set and an eval script. Cost and latency sit next to accuracy. One slice (vendor, locale, or doc type).',
		test: 'CI or a local command prints the table. You can refuse to ship if a gate fails.',
		github: 'Push `evals/` + README. Optional: Opik/Langfuse project link in the README.',
	},
	'lab: document systems you already ship': {
		build: 'One lab on a redacted sample: type routing, line items, vendor match, or STP vs HITL cutoff. Write the silent miss you still would not catch.',
		test: 'Precision/recall or STP on the sample is in the README, plus the failure class.',
		github: 'Push the lab script/notebook and `notes/document-lab.md`. No real tenant data.',
	},
	'lab: voice systems you already ship': {
		build: 'One lab: turn-latency budget, tool-call mid-call, or post-call transcript → JSON. Name STT/LLM/TTS and the fallback.',
		test: 'A number for p95 or a scored transcript set, not “the call felt fine.”',
		github: 'Push `notes/voice-lab.md` and any eval fixtures (redacted).',
	},
	'mlops berlin interviews expect': {
		build: 'Docker one FastAPI (or similar) service. GitHub Actions runs tests plus a tiny eval job. Sketch Peakflo onto queue / store / trace.',
		test: '`docker compose up` (or one documented command) and a green Actions run.',
		github: 'Push Dockerfile, workflow YAML, and the Actions URL in the README.',
	},
	'eu-ready: gdpr, ai act, regulated fintech': {
		build: 'One-pager: lawful basis, minimisation, retention, DSAR, erasure vs embeddings. Red-team one flow (prompt injection via PDF or cross-tenant leak).',
		test: 'You can say whether invoice OCR / collections voice is limited or high-risk in your telling, and why.',
		github: 'Push `notes/gdpr-ai-act.md`. No live customer data.',
	},
	'germany career track': {
		build: 'Rewrite one Peakflo bullet in bottleneck / metric / lever / failure language. Public README a Berlin hiring manager can skim in 60 seconds.',
		test: 'The README has a run command, a metric, and a failure you handled.',
		github: 'Push or update the public career-track repo. Link official Blue Card / Anabin pages in a `notes/germany.md` (not legal advice).',
	},
	'write it like production': {
		build: 'Public write-up of a bottleneck you found and the lever that moved a number — or a 12-minute mock outline with metric + fix.',
		test: 'The post or `writeups/` file has a number and a failure, not a tool list.',
		github: 'Push the write-up. Optionally link the public post in the README.',
	},
};

function sectionKey(section: string): string {
	return section.trim().toLowerCase();
}

export function practicalEnabled(trackId: TrackId): boolean {
	return PRACTICAL_TRACKS.includes(trackId);
}

export function challengeForItem(item: RoadmapItem): PracticalChallenge | undefined {
	if (!practicalEnabled(item.trackId)) {
		return undefined;
	}
	const body = AI_CHALLENGES[sectionKey(item.section)] ?? FALLBACK[item.trackId];
	const requireGithub = body.requireGithub ?? item.trackId === 'ai-engineering';
	return { section: item.section, source: SOURCE[item.trackId], ...body, requireGithub };
}

export function challengesForItems(items: RoadmapItem[]): PracticalChallenge[] {
	const seen = new Set<string>();
	const list: PracticalChallenge[] = [];
	for (const item of items) {
		const challenge = challengeForItem(item);
		if (!challenge || seen.has(challenge.section)) {
			continue;
		}
		seen.add(challenge.section);
		list.push(challenge);
	}
	return list;
}

export function ticketPracticalChallenges(ticket: Ticket, items: RoadmapItem[]): PracticalChallenge[] {
	if (isChoreTicket(ticket)) {
		return [];
	}
	return challengesForItems(ticketTopics(ticket, items));
}

export function ticketNeedsPracticalEvidence(ticket: Ticket, items: RoadmapItem[]): boolean {
	return ticketPracticalChallenges(ticket, items).some((challenge) => challenge.requireGithub);
}

export function parseGitHubUrls(text: string): string[] {
	const found: string[] = [];
	for (const raw of text.split(/[\s,]+/)) {
		const trimmed = raw.trim().replace(/[)\].,;]+$/, '');
		if (!trimmed) {
			continue;
		}
		const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
		try {
			const url = new URL(href);
			const host = url.hostname.replace(/^www\./, '');
			if (host === 'github.com' || host === 'gist.github.com') {
				found.push(url.toString());
			}
		} catch {
			continue;
		}
	}
	return [...new Set(found)];
}
