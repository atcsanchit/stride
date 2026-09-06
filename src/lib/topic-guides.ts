import type { TrackId } from '../types';

export type ResourceKind = 'problem' | 'read' | 'practice' | 'paper' | 'explainer' | 'docs';

export type ResourceLink = {
	label: string;
	href: string;
	kind: ResourceKind;
};

export type TopicGuide = {
	blurb: string;
	layman?: string;
	pattern?: string;
	complexity?: string;
	links: ResourceLink[];
};

const KIND_LABEL: Record<ResourceKind, string> = {
	problem: 'Problem',
	read: 'Unblock',
	practice: 'Practice',
	explainer: 'Layman',
	paper: 'Papers',
	docs: 'Docs',
};

export function resourceKindLabel(kind: ResourceKind): string {
	return KIND_LABEL[kind];
}

function keyOf(trackId: TrackId, section: string): string {
	return `${trackId}::${section.trim().toLowerCase()}`;
}

const GUIDES: Record<string, TopicGuide> = {
	'dsa::sorting': {
		blurb:
			'Sorting is the first place interviews test whether you can state time and space, then implement. Merge sort is the stable n log n baseline. Quick sort is the in-place average-case workhorse. Sort Colors (Dutch national flag) is the interview-sized version of a linear partition.',
		links: [
			{ kind: 'read', label: 'takeUforward sorting articles', href: 'https://takeuforward.org/blogs/sorting' },
			{ kind: 'explainer', label: 'VisuAlgo sorting (watch the swaps)', href: 'https://visualgo.net/en/sorting' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'NeetCode practice', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::arrays': {
		blurb:
			'Most product-company screens start here. Prefix sums, in-place two-pass, and Kadane are the patterns. If you can rewrite Maximum Subarray, Next Permutation, and Set Matrix Zeroes from scratch, you are past the easy filter.',
		links: [
			{ kind: 'read', label: 'takeUforward arrays', href: 'https://takeuforward.org/blogs/arrays' },
			{ kind: 'practice', label: 'Striver SDE sheet (opens on Arrays)', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'dsa::hashing': {
		blurb:
			'A hash map turns an O(n²) scan into one pass. Frequency maps, prefix-sum maps, and “have I seen this?” sets cover Two Sum, anagrams, and subarray-sum problems. Know collision cost in words, then just use the language map.',
		links: [
			{ kind: 'read', label: 'takeUforward hashing', href: 'https://takeuforward.org/blogs/hashing' },
			{ kind: 'read', label: 'CP-Algorithms string hashing', href: 'https://cp-algorithms.com/string/string-hashing.html' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
		],
	},
	'dsa::two pointers': {
		blurb:
			'Two indices walk a sorted array or a string so you never restart the scan. Same direction for remove-duplicates / palindrome; opposite ends for pair-sum, 3Sum, and container-with-most-water. If the array is unsorted, sort first or you are in hashing.',
		links: [
			{ kind: 'read', label: 'takeUforward two pointers', href: 'https://takeuforward.org/blogs/two-pointers' },
			{ kind: 'read', label: 'GFG two-pointer technique', href: 'https://www.geeksforgeeks.org/dsa/two-pointers-technique/' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
		],
	},
	'dsa::sliding window': {
		blurb:
			'A window is two pointers plus a running state (count, sum, set). Expand right, shrink left when the constraint breaks. Variable windows: longest substring without repeat. Fixed or shrinking: minimum window substring. Draw the invariant before coding.',
		links: [
			{ kind: 'read', label: 'takeUforward sliding window', href: 'https://takeuforward.org/blogs/sliding-window' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
		],
	},
	'dsa::binary search': {
		blurb:
			'Not “find an index in a sorted array.” The interview version is binary search on the answer: koko, ship packages, split array, aggressive cows. Predicate: mid is feasible → search left or right. Rotated-array search is the classic 1D trap.',
		links: [
			{ kind: 'read', label: 'takeUforward binary search', href: 'https://takeuforward.org/blogs/binary-search' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'dsa::strings': {
		blurb:
			'Strings in interviews are arrays with extra operations: reverse words, atoi, KMP/strStr, palindromes. Know in-place reverse and two-pointer palindrome. KMP prefix function is the one “hard” string algo worth implementing once.',
		links: [
			{ kind: 'read', label: 'takeUforward strings', href: 'https://takeuforward.org/blogs/string' },
			{ kind: 'read', label: 'CP-Algorithms prefix function (KMP)', href: 'https://cp-algorithms.com/string/prefix-function.html' },
			{ kind: 'practice', label: 'Striver SDE sheet', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::linked list': {
		blurb:
			'Fast/slow pointers find middle, cycle, and cycle start. Dummy heads keep insert/delete clean. Reverse in k-groups and copy-list-with-random-pointer are the two problems that separate “I reversed a list once” from “I can mutate pointers under pressure.”',
		links: [
			{ kind: 'read', label: 'takeUforward linked list', href: 'https://takeuforward.org/blogs/linked-list' },
			{ kind: 'practice', label: 'Striver SDE sheet', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'dsa::recursion and backtracking': {
		blurb:
			'Recursion is the call stack as a data structure. Backtracking is: choose, recurse, un-choose. Subsets / combinations / permutations are the same skeleton with a different choice set. N-Queens and Sudoku are that skeleton with a board constraint.',
		links: [
			{ kind: 'read', label: 'takeUforward recursion', href: 'https://takeuforward.org/blogs/recursion' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::bit manipulation': {
		blurb:
			'Bits are a set you can union (OR), intersect (AND), and toggle (XOR) in O(1). Single Number is XOR. n & (n-1) clears the lowest set bit. You do not need bit tricks trivia; you need XOR, shifts, and “count set bits” cold.',
		links: [
			{ kind: 'read', label: 'takeUforward bit manipulation', href: 'https://takeuforward.org/blogs/bit-manipulation' },
			{ kind: 'read', label: 'Bit Twiddling Hacks (Stanford)', href: 'https://graphics.stanford.edu/~seander/bithacks.html' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'dsa::stack and queue': {
		blurb:
			'A stack is last-in first-out: parentheses, next-greater, monotonic stack for histogram. A queue is BFS. LRU is a hashmap plus doubly linked list. If you can explain why the monotonic stack is increasing or decreasing, Daily Temperatures and largest rectangle follow.',
		links: [
			{ kind: 'read', label: 'takeUforward stack', href: 'https://takeuforward.org/blogs/stack' },
			{ kind: 'read', label: 'takeUforward queue', href: 'https://takeuforward.org/blogs/queue' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'Striver SDE sheet', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
		],
	},
	'dsa::heap': {
		blurb:
			'A heap gives you the current min or max in log n. Kth largest, top-k frequent, and merge-k lists are the same idea. Median of a stream is two heaps. Do not implement a heap in the interview unless they ask; use the language priority queue and state the complexity.',
		links: [
			{ kind: 'read', label: 'takeUforward heap', href: 'https://takeuforward.org/blogs/heap' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
		],
	},
	'dsa::greedy': {
		blurb:
			'Greedy works when a local choice is provably safe: jump game, gas station, interval scheduling, Huffman-style job sequencing. Sort, then take or skip. If you cannot name the proof sketch (exchange argument or “stays feasible”), it is probably DP.',
		links: [
			{ kind: 'read', label: 'takeUforward greedy', href: 'https://takeuforward.org/blogs/greedy' },
			{ kind: 'practice', label: 'Striver SDE sheet', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::binary trees': {
		blurb:
			'Every tree problem is a traversal plus a return value. DFS returns height, balanced, LCA, max path. BFS returns level order and right side view. Serialize/deserialize is the hard “I can talk about the shape of a tree as a string” check.',
		links: [
			{ kind: 'read', label: 'takeUforward binary tree', href: 'https://takeuforward.org/blogs/binary-tree' },
			{ kind: 'practice', label: 'Striver SDE sheet', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'dsa::binary search trees': {
		blurb:
			'A BST is a tree with an inorder that is sorted. Validate BST is the bounds problem, not “left < node < right” on one node. Kth smallest is inorder with a counter. LCA in a BST walks down, not up.',
		links: [
			{ kind: 'read', label: 'takeUforward BST introduction', href: 'https://takeuforward.org/data-structure/binary-search-tree-bst-introduction/' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::graphs': {
		blurb:
			'BFS for shortest unweighted path and rotting oranges. DFS for cycle and components. Topological sort for course schedule and alien dictionary. Then weighted: Dijkstra, and MST (Prim/Kruskal). Union-find for redundant connection and accounts merge. Draw the graph before you pick the algo.',
		links: [
			{ kind: 'read', label: 'takeUforward graph', href: 'https://takeuforward.org/blogs/graph' },
			{ kind: 'read', label: 'CP-Algorithms BFS', href: 'https://cp-algorithms.com/graph/breadth-first-search.html' },
			{ kind: 'read', label: 'CP-Algorithms Dijkstra', href: 'https://cp-algorithms.com/graph/dijkstra.html' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::dynamic programming': {
		blurb:
			'DP is recursion with a memo, or a table that fills the same recurrence bottom-up. Name the state (index, remaining capacity, last pick), then the transition. Grids, knapsack/subsets, LCS/edit distance, LIS, and stock variants are the interview families. MCM/partition DP is the extra Striver layer.',
		links: [
			{ kind: 'read', label: 'Striver DP series', href: 'https://takeuforward.org/dynamic-programming/striver-dp-series-dynamic-programming-problems' },
			{ kind: 'read', label: 'CP-Algorithms LIS', href: 'https://cp-algorithms.com/sequences/longest_increasing_subsequence.html' },
			{ kind: 'practice', label: 'Striver A2Z sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::tries': {
		blurb:
			'A trie is a tree of prefixes. Insert and search are O(length). Word Search II is trie plus backtracking on a board. XOR tries are the same idea on bits. Implement prefix tree once by hand so the rest is pattern matching.',
		links: [
			{ kind: 'read', label: 'takeUforward trie', href: 'https://takeuforward.org/blogs/trie' },
			{ kind: 'practice', label: 'Striver SDE sheet', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode 150', href: 'https://neetcode.io/practice' },
		],
	},
	'dsa::interview reps': {
		blurb:
			'The sheet is not the interview. Timed reps are: say the brute force, name the pattern, code, then complexity. Redo misses the next day from a blank file. A 45-minute mock with a person is worth more than ten untimed mediums.',
		links: [
			{ kind: 'practice', label: 'NeetCode 150 timed', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
			{ kind: 'read', label: 'takeUforward SDE sheet as a mock list', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
		],
	},

	'system-design::foundations': {
		blurb:
			'Interviews are vocabulary plus one tradeoff. Latency vs throughput, p99 vs average, SLO vs SLA, cache stampede, sync vs async replication. You should be able to pick a database and a cache and say what breaks first.',
		links: [
			{ kind: 'read', label: 'System Design Primer (GitHub)', href: 'https://github.com/donnemartin/system-design-primer' },
			{ kind: 'read', label: 'Hello Interview: System Design in a Hurry', href: 'https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction' },
			{ kind: 'read', label: 'ByteByteGo System Design 101', href: 'https://github.com/ByteByteGoHq/system-design-101' },
			{ kind: 'read', label: 'DDIA companion site', href: 'https://dataintensive.net/' },
		],
	},
	'system-design::core interview drills': {
		blurb:
			'These are the canonical boxes-and-arrows problems: shortener, feed, chat, rate limiter, unique IDs. Hello Interview and the Primer solutions exist so you can compare your API and data model, not copy the diagram.',
		links: [
			{ kind: 'read', label: 'Primer: interview questions with solutions', href: 'https://github.com/donnemartin/system-design-primer' },
			{ kind: 'read', label: 'Hello Interview course', href: 'https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction' },
			{ kind: 'practice', label: 'ByteByteGo visual guides (GitHub index)', href: 'https://github.com/ByteByteGoHq/system-design-101' },
		],
	},
	'system-design::data and storage design': {
		blurb:
			'This is closer to the work you already do: events, WAL, CDC, object storage for PDFs. Time-series and analytics pipelines fail on cardinality and late data, not on “pick Kafka.”',
		links: [
			{ kind: 'read', label: 'System Design Primer', href: 'https://github.com/donnemartin/system-design-primer' },
			{ kind: 'read', label: 'DDIA (book site, not a pirated PDF)', href: 'https://dataintensive.net/' },
			{ kind: 'read', label: 'AWS Well-Architected Framework', href: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
		],
	},
	'system-design::ml and document systems': {
		blurb:
			'This is the interview you will actually get: OCR/IDP, HITL queues, RAG, agents, voice. Design the queue, the retry, the human cutoff, and the eval — not a magic model box.',
		links: [
			{ kind: 'read', label: 'Chip Huyen: MLOps notes', href: 'https://huyenchip.com/mlops/' },
			{ kind: 'read', label: 'Hello Interview (ML system design is on the same site)', href: 'https://www.hellointerview.com/' },
			{ kind: 'explainer', label: 'Pinecone: what RAG is', href: 'https://www.pinecone.io/learn/retrieval-augmented-generation/' },
			{ kind: 'paper', label: 'RAG (Lewis et al., 2020)', href: 'https://arxiv.org/abs/2005.11401' },
		],
	},
	'system-design::reliability and operations': {
		blurb:
			'Golden signals, traces, circuit breakers, tenant isolation. If you cannot say how you would find a silent OCR miss, the design is unfinished. Multi-region is a later slide; observability is the first.',
		links: [
			{ kind: 'read', label: 'AWS Well-Architected', href: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
			{ kind: 'docs', label: 'OpenTelemetry docs', href: 'https://opentelemetry.io/docs/' },
			{ kind: 'read', label: 'System Design Primer', href: 'https://github.com/donnemartin/system-design-primer' },
		],
	},
	'system-design::how to answer': {
		blurb:
			'Restate the problem, lock constraints, sketch API, then data, then the bottleneck. One tradeoff you would ship. Hello Interview is built backwards from how FAANG interviewers score this.',
		links: [
			{ kind: 'read', label: 'Hello Interview: System Design in a Hurry', href: 'https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction' },
			{ kind: 'read', label: 'Primer: how to approach the interview', href: 'https://github.com/donnemartin/system-design-primer' },
		],
	},

	'dsa::how to learn anything (session)': {
		blurb:
			'Erin Meryl: you do not learn by watching a solution. You learn when you pull the pattern out of your head onto the editor. Blurt 10 minutes, code from blank, log one sentence, revisit within 24 hours. That is the session. The sheet is only the queue.',
		links: [
			{ kind: 'explainer', label: 'Erin Meryl: how I studied at Cambridge (production vs familiarity)', href: 'https://www.youtube.com/@erinmerylstudy' },
			{ kind: 'practice', label: 'NeetCode 150 — apply, do not binge', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'system-design::how to learn anything (session)': {
		blurb:
			'Reading a primer is familiarity. The interview is production: a timed sketch you can wipe. Restate, API, data, bottleneck, one tradeoff. Thursday on Today is that event.',
		links: [
			{ kind: 'read', label: 'Hello Interview: System Design in a Hurry', href: 'https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction' },
			{ kind: 'read', label: 'Primer', href: 'https://github.com/donnemartin/system-design-primer' },
		],
	},

	'ai-engineering::how to learn anything': {
		blurb:
			'Erin Meryl’s How to learn anything: track what you are learning right now so you can follow the interest over time. Learning is production (blurt, ship, explain), not consumption (another lecture). Revisit within 24 hours. Start in two minutes when activation energy is the blocker. Learn in public while it is still messy.',
		layman:
			'If you watched three RAG videos and shipped nothing, you did not study. If you blurted retrieval vs generation, ran a 20-doc table, and wrote one sentence on Complete, you did.',
		links: [
			{ kind: 'explainer', label: 'Reel: How to learn anything (@erinmerylstudy)', href: 'https://www.instagram.com/reel/Dbvs37KPzUb/' },
			{ kind: 'explainer', label: 'Erin Meryl site', href: 'https://erinmerylstudy.com/' },
			{ kind: 'read', label: 'Learn in public (her standing advice)', href: 'https://www.linkedin.com/in/erin-mcgurk' },
		],
	},
	'ai-engineering::flagship builds (this season)': {
		blurb:
			'Depth over a new playlist. One traced eval harness, one domain RAG with a retrieval table, one public weekly sentence. These are the happenings, not extra certificates.',
		links: [
			{ kind: 'practice', label: 'jamwithai production-agentic-RAG course', href: 'https://github.com/jamwithai/production-agentic-rag-course' },
			{ kind: 'practice', label: 'Nir Diamant RAG Techniques', href: 'https://github.com/NirDiamant/RAG_Techniques' },
		],
	},
	'ai-engineering::how she would run this': {
		blurb:
			'Shirin’s own rule: months marked non-negotiable are the job. For someone already shipping at Peakflo, that is not Python. It is evals before prompt tricks, retrieval quality over cleverness, and one deep repo instead of certificate collecting. Translate Inngest and scratchpad into LangGraph and memory types so a Berlin interviewer hears a system, not a vendor.',
		layman:
			'You are not starting from zero. Do not spend a month on CS50. Spend it making the invoice and voice work you already did sound like production AI engineering — with a number, a failure, and a trace.',
		links: [
			{ kind: 'read', label: 'Jam with AI (her syllabus, not Instagram)', href: 'https://jamwithai.substack.com/' },
			{ kind: 'read', label: 'Data Science Roadmap 2026 (then skip Phases 0–2)', href: 'https://jamwithai.substack.com/p/data-science-roadmap-2026' },
			{ kind: 'read', label: 'Jam with AI production-agentic-RAG course (GitHub)', href: 'https://github.com/jamwithai/production-agentic-rag-course' },
			{ kind: 'read', label: 'YouTube: @jam-with-ai', href: 'https://www.youtube.com/@jam-with-ai' },
			{ kind: 'read', label: 'jamwithai.dev', href: 'https://jamwithai.dev' },
		],
	},
	'ai-engineering::courses she actually assigned': {
		blurb:
			'These are the links she repeats: DeepLearning.AI short courses, Karpathy, Chip Huyen’s two books, Hands-On LLMs, Made With ML, Nir Diamant, her own RAG course. Finish this list. Do not start a second list.',
		layman:
			'She is not vague about homework. If a Berlin hiring manager took her roadmap, they would expect you to have touched LangGraph, RAG evals, and a real MLOps repo — not another “I used LangChain” line.',
		links: [
			{ kind: 'docs', label: 'LangChain for LLM Application Development', href: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/' },
			{ kind: 'docs', label: 'AI Agents in LangGraph', href: 'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/' },
			{ kind: 'docs', label: 'Long-Term Agentic Memory with LangGraph', href: 'https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/' },
			{ kind: 'docs', label: 'Building and Evaluating Advanced RAG', href: 'https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/' },
			{ kind: 'docs', label: 'Fine-Tuning Large Language Models', href: 'https://www.deeplearning.ai/short-courses/finetuning-large-language-models/' },
			{ kind: 'docs', label: 'Generative AI with LLMs', href: 'https://www.deeplearning.ai/courses/generative-ai-with-llms/' },
			{ kind: 'explainer', label: 'Karpathy: Neural Nets Zero to Hero', href: 'https://karpathy.ai/zero-to-hero.html' },
			{ kind: 'read', label: 'Chip Huyen books (DMLS + AI Engineering)', href: 'https://huyenchip.com/books/' },
			{ kind: 'read', label: 'AI Engineering companion repo', href: 'https://github.com/chiphuyen/aie-book' },
			{ kind: 'read', label: 'Hands-On Large Language Models (book site)', href: 'https://www.llm-book.com/' },
			{ kind: 'docs', label: 'Made With ML', href: 'https://madewithml.com/' },
			{ kind: 'practice', label: 'Nir Diamant: RAG Techniques', href: 'https://github.com/NirDiamant/RAG_Techniques' },
			{ kind: 'practice', label: 'Nir Diamant: GenAI Agents', href: 'https://github.com/NirDiamant/GenAI_Agents' },
			{ kind: 'practice', label: 'Nir Diamant: Agents Towards Production', href: 'https://github.com/NirDiamant/agents-towards-production' },
			{ kind: 'practice', label: 'jamwithai beginner local RAG', href: 'https://github.com/jamwithai/beginner-local-rag-system' },
			{ kind: 'docs', label: 'LangChain Academy', href: 'https://academy.langchain.com/' },
			{ kind: 'explainer', label: 'Pinecone LangChain handbook series', href: 'https://www.pinecone.io/learn/series/langchain/' },
			{ kind: 'docs', label: 'Prompt Engineering for Developers (only if rusty)', href: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/' },
		],
	},
	'ai-engineering::the first question only': {
		blurb:
			'RLHF, LoRA, LLM, RAG are the screen. One sentence each, then stop. Your Flan-T5 project is LoRA-adjacent; Peakflo OCR is not “we fine-tuned a foundation model.” Interviews that stay on acronyms are not the job.',
		layman:
			'RAG is look-it-up-then-write. LoRA is a sticker on a frozen brain. RLHF/DPO is showing the model which answers humans liked. If you can pick which tool a changing invoice layout needs, you passed. Then talk about the miss.',
		links: [
			{ kind: 'explainer', label: 'Prompting Guide', href: 'https://www.promptingguide.ai/' },
			{ kind: 'explainer', label: 'Pinecone: what RAG is', href: 'https://www.pinecone.io/learn/retrieval-augmented-generation/' },
			{ kind: 'paper', label: 'Attention Is All You Need', href: 'https://arxiv.org/abs/1706.03762' },
			{ kind: 'paper', label: 'RAG (Lewis et al., 2020)', href: 'https://arxiv.org/abs/2005.11401' },
			{ kind: 'paper', label: 'LoRA (Hu et al., 2021)', href: 'https://arxiv.org/abs/2106.09685' },
			{ kind: 'paper', label: 'InstructGPT (RLHF)', href: 'https://arxiv.org/abs/2203.02155' },
			{ kind: 'paper', label: 'Direct Preference Optimization', href: 'https://arxiv.org/abs/2305.18290' },
			{ kind: 'docs', label: 'DeepLearning.AI RLHF short course', href: 'https://www.deeplearning.ai/short-courses/reinforcement-learning-from-human-feedback/' },
			{ kind: 'read', label: 'Hugging Face LLM course, ch. 1', href: 'https://huggingface.co/learn/llm-course/chapter1/1' },
		],
	},
	'ai-engineering::finding bottlenecks': {
		blurb:
			'Latency is not “the model is slow.” Prefill shows up as TTFT. Decode shows up as TPOT. A Peakflo bill also has GCS, the queue, and a human. A LiveKit turn also has STT, TTS, and transfer-call. If you cannot name the segment, you will optimize the wrong one.',
		layman:
			'Prefill is chopping the whole counter at once. Decode is plating one bite and walking back to the fridge every time. If the user waits before the first word, chopping. If the sentence dribbles, plating. Trace the ticket before you hire another cook.',
		links: [
			{ kind: 'read', label: 'Jam with AI: LLM inference 101', href: 'https://jamwithai.substack.com/p/llm-inference-101' },
			{ kind: 'read', label: 'Jam with AI: 10 latency techniques', href: 'https://jamwithai.substack.com/p/ml-and-llm-inference-latency-10-techniques' },
			{ kind: 'read', label: 'Jam with AI: blocking calls on async FastAPI', href: 'https://jamwithai.substack.com/p/the-concurrency-mistake-hiding-in' },
			{ kind: 'docs', label: 'OpenTelemetry', href: 'https://opentelemetry.io/docs/' },
			{ kind: 'docs', label: 'vLLM docs', href: 'https://docs.vllm.ai/en/latest/' },
			{ kind: 'docs', label: 'LiveKit Agents', href: 'https://docs.livekit.io/agents/' },
		],
	},
	'ai-engineering::reducing latency': {
		blurb:
			'Levers are specific. Prefix cache and shorter prompts cut prefill. Smaller models and speculative decoding cut decode. RAG latency is often too many chunks — you already claimed a 50% retrieval-time cut at ZS; be able to say whether that was index, query, or network. Voice is a hard p95. Fat PDFs belong on a queue.',
		layman:
			'Do not make the intern faster by handing them a thicker textbook. Cache what they already read, route easy tickets cheap, rerank instead of photocopying twenty pages. On a call, a pause longer than about a second and a half feels like a hang-up.',
		links: [
			{ kind: 'read', label: 'Jam with AI: 10 latency techniques', href: 'https://jamwithai.substack.com/p/ml-and-llm-inference-latency-10-techniques' },
			{ kind: 'docs', label: 'vLLM serving', href: 'https://docs.vllm.ai/en/latest/' },
			{ kind: 'docs', label: 'OpenAI Realtime API', href: 'https://developers.openai.com/api/docs/guides/realtime' },
			{ kind: 'explainer', label: 'Pinecone: chunking strategies', href: 'https://www.pinecone.io/learn/chunking-strategies/' },
		],
	},
	'ai-engineering::quality, cost, and latency tradeoffs': {
		blurb:
			'You cannot maximize all three. STP vs HITL is the same curve as cheap-default vs frontier fallback. RAG wins when vendor layouts change. LoRA wins when behavior is stable and you cannot afford the retrieval hop. Put $ / document next to the A/B you already run or the “better” prompt is just more expensive.',
		layman:
			'91% straight-through is a hospital triage line: the model takes the easy bills, a person sees the rest. Paying frontier prices for every line item is how you lose unit economics, not how you get quality.',
		links: [
			{ kind: 'read', label: 'Jam with AI: 7 production patterns', href: 'https://jamwithai.substack.com/p/system-design-for-ai-engineers-7' },
			{ kind: 'read', label: 'Anthropic: Building effective agents', href: 'https://www.anthropic.com/engineering/building-effective-agents' },
			{ kind: 'paper', label: 'LoRA', href: 'https://arxiv.org/abs/2106.09685' },
			{ kind: 'paper', label: 'RAG (Lewis et al., 2020)', href: 'https://arxiv.org/abs/2005.11401' },
			{ kind: 'docs', label: 'OpenAI structured outputs', href: 'https://developers.openai.com/api/docs/guides/structured-outputs' },
		],
	},
	'ai-engineering::handling failures': {
		blurb:
			'The scary Peakflo bug is a bill marked done whose total is wrong. Timeouts, idempotent writes, circuit breakers, a human node, and a grep-able log line. LangGraph and ReAct matter because they are a loop with a stop condition.',
		layman:
			'Retries that create two bills are worse than a timeout. A circuit breaker is a fuse for the OCR vendor. A human approval step is how you keep the fuse from being the customer.',
		links: [
			{ kind: 'read', label: 'Jam with AI: 7 production patterns', href: 'https://jamwithai.substack.com/p/system-design-for-ai-engineers-7' },
			{ kind: 'read', label: 'Anthropic: Building effective agents', href: 'https://www.anthropic.com/engineering/building-effective-agents' },
			{ kind: 'paper', label: 'Lost in the Middle', href: 'https://arxiv.org/abs/2307.03172' },
			{ kind: 'paper', label: 'ReAct', href: 'https://arxiv.org/abs/2210.03629' },
			{ kind: 'docs', label: 'LangGraph overview', href: 'https://docs.langchain.com/oss/python/langgraph/overview' },
			{ kind: 'docs', label: 'Model Context Protocol', href: 'https://modelcontextprotocol.io' },
		],
	},
	'ai-engineering::retrieval quality over prompt cleverness': {
		blurb:
			'Her Month 5 line, applied to you: ZS clinical-trial search and Peakflo vendor matching fail on chunking, filters, and hybrid search, not on a prettier system prompt. The RAG triad (context, groundedness, answer) is how you argue with a prompt change.',
		layman:
			'If search hands the model the wrong page, a better prompt just lies more confidently. Fix the filing cabinet before you rewrite the intern’s script. That 50% faster retrieval at ZS is the story — say what you changed in the cabinet.',
		links: [
			{ kind: 'docs', label: 'Building and Evaluating Advanced RAG', href: 'https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/' },
			{ kind: 'docs', label: 'LangChain: Chat with Your Data', href: 'https://www.deeplearning.ai/short-courses/langchain-chat-with-your-data/' },
			{ kind: 'practice', label: 'Nir Diamant RAG Techniques', href: 'https://github.com/NirDiamant/RAG_Techniques' },
			{ kind: 'practice', label: 'jamwithai production agentic RAG', href: 'https://github.com/jamwithai/production-agentic-rag-course' },
			{ kind: 'explainer', label: 'Pinecone: RAG', href: 'https://www.pinecone.io/learn/retrieval-augmented-generation/' },
			{ kind: 'docs', label: 'Pinecone hybrid search', href: 'https://docs.pinecone.io/guides/search/hybrid-search' },
			{ kind: 'paper', label: 'Dense Passage Retrieval', href: 'https://arxiv.org/abs/2004.04906' },
			{ kind: 'paper', label: 'Lost in the Middle', href: 'https://arxiv.org/abs/2307.03172' },
		],
	},
	'ai-engineering::agents, memory, and orchestration': {
		blurb:
			'An agent is a loop with a budget. Your scratchpad is working memory. She names six more. LangGraph is the interview dialect for what you already do in Inngest. Job Agent + Opik is the side project that is also your Germany job hunt.',
		layman:
			'A chatbot answers once. An agent may use tools until it should stop. Memory is not “we store the chat.” It is what to remember, for whom, for how long, and when to forget — especially across tenants.',
		links: [
			{ kind: 'read', label: 'Jam with AI: 7 types of agent memory', href: 'https://jamwithai.substack.com/p/agent-memory-the-7-types-you-should' },
			{ kind: 'read', label: 'Job Agent Part 1 (LangGraph + Opik)', href: 'https://jamwithai.substack.com/p/build-your-own-job-agent-part-1' },
			{ kind: 'read', label: 'MCP vs API vs function calling', href: 'https://jamwithai.substack.com/p/when-to-use-mcp-vs-api-vs-functiontool' },
			{ kind: 'docs', label: 'AI Agents in LangGraph', href: 'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/' },
			{ kind: 'docs', label: 'Long-Term Agentic Memory with LangGraph', href: 'https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/' },
			{ kind: 'explainer', label: 'Lilian Weng: LLM agents', href: 'https://lilianweng.github.io/posts/2023-06-23-agent/' },
			{ kind: 'docs', label: 'Opik quickstart', href: 'https://www.comet.com/docs/opik/quickstart' },
			{ kind: 'practice', label: 'Nir Diamant GenAI Agents', href: 'https://github.com/NirDiamant/GenAI_Agents' },
			{ kind: 'paper', label: 'ReAct', href: 'https://arxiv.org/abs/2210.03629' },
		],
	},
	'ai-engineering::proving it works': {
		blurb:
			'Evals are tests for non-deterministic software. Grow 43 unit tests into a versioned golden set with field-level match. Trace in Opik/Langfuse. LLM-as-judge is a metric. Her A/B post is how you promote an OCR prompt in a regulated workflow.',
		layman:
			'“It felt better” is not a gate. If the new prompt is two points more accurate and four times the cost, that is a product decision. Put cost and latency on the same dashboard as accuracy.',
		links: [
			{ kind: 'read', label: 'Jam with AI: A/B testing for production AI/ML', href: 'https://jamwithai.substack.com/p/the-production-aiml-engineers-guide' },
			{ kind: 'docs', label: 'RAGAS', href: 'https://docs.ragas.io/en/stable/' },
			{ kind: 'explainer', label: 'Pinecone: RAGAS', href: 'https://www.pinecone.io/learn/series/rag/ragas/' },
			{ kind: 'docs', label: 'Opik', href: 'https://www.comet.com/docs/opik/' },
			{ kind: 'docs', label: 'Langfuse docs', href: 'https://langfuse.com/docs' },
			{ kind: 'paper', label: 'Judging LLM-as-a-Judge', href: 'https://arxiv.org/abs/2306.05685' },
			{ kind: 'paper', label: 'HELM', href: 'https://arxiv.org/abs/2211.09110' },
			{ kind: 'docs', label: 'Hugging Face Evaluate', href: 'https://huggingface.co/docs/evaluate/index' },
		],
	},
	'ai-engineering::lab: document systems you already ship': {
		blurb:
			'Invoices are layout plus text. LayoutLM and Donut are the papers. Your job is routing, HITL cutoff, vendor match, and the silent miss. Apply bottleneck / latency / failure here — this is the Peakflo story a Berlin insurtech or AP team would hire.',
		layman:
			'A PDF is a picture of a table pretending to be text. If the model is unsure, a human sees it. That queue is the product. The 91% number is the line you drew.',
		links: [
			{ kind: 'paper', label: 'LayoutLM', href: 'https://arxiv.org/abs/1912.13318' },
			{ kind: 'paper', label: 'LayoutLMv3', href: 'https://arxiv.org/abs/2204.08387' },
			{ kind: 'paper', label: 'Donut', href: 'https://arxiv.org/abs/2111.15664' },
			{ kind: 'docs', label: 'Hugging Face LayoutLMv3', href: 'https://huggingface.co/docs/transformers/model_doc/layoutlmv3' },
			{ kind: 'docs', label: 'Azure Document Intelligence', href: 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview' },
			{ kind: 'docs', label: 'Pinecone hybrid search', href: 'https://docs.pinecone.io/guides/search/hybrid-search' },
		],
	},
	'ai-engineering::lab: voice systems you already ship': {
		blurb:
			'STT → LLM → TTS plus turn detection. You already added scratchpad, dates, transfer, multilingual. The interview is p95, interruption, and which of those belong in code. Whisper is the open ASR baseline. LiveKit is the kit. JobVis is her observable voice-adjacent agent — steal the tracing, not the product.',
		layman:
			'If you wait three seconds on a tool call mid-sentence, the call feels broken even when the answer is perfect. Measure the pause. Name the memory.',
		links: [
			{ kind: 'paper', label: 'Whisper', href: 'https://arxiv.org/abs/2212.04356' },
			{ kind: 'docs', label: 'LiveKit Agents', href: 'https://docs.livekit.io/agents/' },
			{ kind: 'docs', label: 'OpenAI Realtime API', href: 'https://developers.openai.com/api/docs/guides/realtime' },
			{ kind: 'read', label: 'Job Agent Part 1 (observable agent pattern)', href: 'https://jamwithai.substack.com/p/build-your-own-job-agent-part-1' },
			{ kind: 'read', label: '7 types of agent memory', href: 'https://jamwithai.substack.com/p/agent-memory-the-7-types-you-should' },
			{ kind: 'read', label: 'Jam with AI: 10 latency techniques', href: 'https://jamwithai.substack.com/p/ml-and-llm-inference-latency-10-techniques' },
		],
	},
	'ai-engineering::mlops berlin interviews expect': {
		blurb:
			'Her Month 4: deployment, CI/CD, experiment tracking, observability. You have GitHub Actions and Docker on the resume — make them real on a public service. Skip Kubernetes unless the spec names it. Made With ML is the repo she links. Agent Ops is the architecture diagram to steal.',
		layman:
			'MLOps is not a job title. It is “I can run this tomorrow on someone else’s laptop, see when it got worse, and not re-train from a notebook called final_v7.”',
		links: [
			{ kind: 'docs', label: 'Made With ML', href: 'https://madewithml.com/' },
			{ kind: 'practice', label: 'Made-With-ML GitHub', href: 'https://github.com/GokuMohandas/Made-With-ML' },
			{ kind: 'docs', label: 'ML Engineering for Production (DeepLearning.AI)', href: 'https://www.deeplearning.ai/courses/machine-learning-engineering-for-production-mlops/' },
			{ kind: 'read', label: 'Chip Huyen books', href: 'https://huyenchip.com/books/' },
			{ kind: 'read', label: 'Jam with AI: Agent Ops in the real world', href: 'https://jamwithai.substack.com/p/agent-ops-in-the-real-world' },
			{ kind: 'docs', label: 'Chip Huyen MLOps notes', href: 'https://huyenchip.com/mlops/' },
			{ kind: 'read', label: 'ml-ops.org', href: 'https://ml-ops.org/' },
		],
	},
	'ai-engineering::eu-ready: gdpr, ai act, regulated fintech': {
		blurb:
			'She ships RAG and agents inside regulated German fintech. GDPR is not a slide. It is lawful basis, minimisation, retention, DSAR, and “the embedding still has the invoice.” The AI Act is how you classify OCR vs collections voice without sounding reckless. Cross-tenant leak is a career-ending demo.',
		layman:
			'In the EU, “we log the whole bill into the prompt for debugging” can be illegal, not just sloppy. Tenant isolation is a privacy control. If a user asks to be forgotten, the vector index counts.',
		links: [
			{ kind: 'read', label: 'What is GDPR (gdpr.eu)', href: 'https://gdpr.eu/what-is-gdpr/' },
			{ kind: 'docs', label: 'European Commission: EU data protection rules', href: 'https://commission.europa.eu/law/law-topic/data-protection/eu-data-protection-rules_en' },
			{ kind: 'docs', label: 'EU AI Act overview (European Commission)', href: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
			{ kind: 'read', label: 'Jam with AI: Agent Ops (regulated-shaped infra)', href: 'https://jamwithai.substack.com/p/agent-ops-in-the-real-world' },
			{ kind: 'read', label: 'Anthropic: Building effective agents (approvals / budgets)', href: 'https://www.anthropic.com/engineering/building-effective-agents' },
		],
	},
	'ai-engineering::germany career track': {
		blurb:
			'The move is a job offer, not a vibe. Official path: Make it in Germany / EU Blue Card (degree + qualified role + salary threshold — check the live figure). Anabin is how you talk about IIIT Una. Target AI/ML Engineer on documents, agents, or voice. Build in public in English. This is not legal advice.',
		layman:
			'Berlin teams that look like her world hire people who have shipped RAG/agents with evals and can talk GDPR. They do not hire “I completed 40 courses.” One traced public repo plus Peakflo stories rewritten as bottleneck/metric/lever is the application.',
		links: [
			{ kind: 'docs', label: 'Make it in Germany: EU Blue Card', href: 'https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card' },
			{ kind: 'docs', label: 'Make it in Germany (home)', href: 'https://www.make-it-in-germany.com/en' },
			{ kind: 'docs', label: 'Anabin institution search (degree recognition)', href: 'https://anabin.kmk.org/no_cache/filter/institutionen.html' },
			{ kind: 'read', label: 'Job Agent Part 1 — hunt roles with an observable agent', href: 'https://jamwithai.substack.com/p/build-your-own-job-agent-part-1' },
			{ kind: 'read', label: 'Chip Huyen books (how to talk in interviews)', href: 'https://huyenchip.com/books/' },
			{ kind: 'read', label: 'Shirin on LinkedIn (follow the production posts)', href: 'https://www.linkedin.com/in/shirin-khosravi-jam/' },
		],
	},
	'ai-engineering::write it like production': {
		blurb:
			'Her habit: build in public. The portfolio is the incident: bottleneck, lever, metric. Rewrite Peakflo bullets until they sound like jam.with.ai — a miss, an eval, a number. A traced invoice harness or JobVis clone beats a toy chatbot.',
		layman:
			'Hiring managers skim. One English README that says “here is the wait, here is what we changed, here is p95” is the interview. Talk about the miss.',
		links: [
			{ kind: 'read', label: 'Jam with AI: 10 latency techniques (tone)', href: 'https://jamwithai.substack.com/p/ml-and-llm-inference-latency-10-techniques' },
			{ kind: 'read', label: 'Anthropic engineering (tone)', href: 'https://www.anthropic.com/engineering/building-effective-agents' },
			{ kind: 'explainer', label: 'Lilian Weng agents post', href: 'https://lilianweng.github.io/posts/2023-06-23-agent/' },
			{ kind: 'docs', label: 'RAGAS', href: 'https://docs.ragas.io/en/stable/' },
			{ kind: 'docs', label: 'Opik', href: 'https://www.comet.com/docs/opik/' },
		],
	},
};

const TRACK_SOURCES: Record<TrackId, TopicGuide> = {
	dsa: {
		blurb:
			'This course follows Striver’s A2Z topic order. Practice on the SDE sheet and NeetCode 150; they overlap heavily with Blind 75 and LeetCode’s Top Interview 150. Do not also grind Love Babbar 450 end-to-end.',
		links: [
			{ kind: 'practice', label: 'Striver A2Z DSA sheet', href: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z' },
			{ kind: 'practice', label: 'Striver SDE sheet (191)', href: 'https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems' },
			{ kind: 'practice', label: 'NeetCode practice / 150', href: 'https://neetcode.io/practice' },
			{ kind: 'practice', label: 'LeetCode Top Interview 150', href: 'https://leetcode.com/studyplan/top-interview-150/' },
		],
	},
	'system-design': {
		blurb:
			'Learn the generic vocabulary from the Primer and Hello Interview, then spend real time on ML/document systems — that is the interview attached to this resume. ByteByteGo’s 101 repo is the visual companion, not a second syllabus.',
		links: [
			{ kind: 'read', label: 'System Design Primer', href: 'https://github.com/donnemartin/system-design-primer' },
			{ kind: 'read', label: 'Hello Interview: in a hurry', href: 'https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction' },
			{ kind: 'read', label: 'ByteByteGo System Design 101', href: 'https://github.com/ByteByteGoHq/system-design-101' },
		],
	},
	'ai-engineering': {
		blurb:
			'Peakflo work, named the way Shirin and a Berlin hiring loop would hear it. Do her assigned courses. Skip beginner Python. The job is bottlenecks, retrieval, agents with memory, evals, GDPR, and one public repo.',
		layman:
			'You already run OCR, voice, and evals. The course is so you can explain a slow bill, a silent miss, or a 1.4s voice budget — and talk GDPR — without stopping at “we use RAG.”',
		links: [
			{ kind: 'read', label: 'Jam with AI: 10 latency techniques', href: 'https://jamwithai.substack.com/p/ml-and-llm-inference-latency-10-techniques' },
			{ kind: 'read', label: 'Jam with AI: agent memory (7 types)', href: 'https://jamwithai.substack.com/p/agent-memory-the-7-types-you-should' },
			{ kind: 'practice', label: 'jamwithai production agentic RAG', href: 'https://github.com/jamwithai/production-agentic-rag-course' },
			{ kind: 'docs', label: 'AI Agents in LangGraph', href: 'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/' },
			{ kind: 'docs', label: 'Make it in Germany: EU Blue Card', href: 'https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card' },
		],
	},
};

export function trackSourceGuide(trackId: TrackId): TopicGuide {
	return TRACK_SOURCES[trackId];
}

export function topicGuide(trackId: TrackId, section: string): TopicGuide | undefined {
	return GUIDES[keyOf(trackId, section)];
}
