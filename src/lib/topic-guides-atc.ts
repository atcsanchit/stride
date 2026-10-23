import type { TopicGuide } from './topic-guides';

// AAI ATC (Junior Executive) class notes — one guide per bundled-roadmap section.
// Keys must match the roadmap `##` headings exactly (trimmed, lowercased).

export const ATC_GUIDES: Record<string, TopicGuide> = {
	'atc::how this course runs': {
		blurb:
			'The paper is 120 questions, 1 mark each, 120 minutes, CBT, no negative marking. Part A (English 20, Reasoning 15, Aptitude 15, GK 10) is locked before Part B (Maths 30 + Physics 30, both Class 11–12 level). Questions come in 3 layers: direct recall (35–45%), plug-and-compute (30–35%), concept + application (20–30%) — so roughly 70–80 marks are pure formula execution. This course trains speed on Layers 1+2 and a calm two-pass policy for Layer 3. Every class below carries its own Pattern notes: formulas, PYQ styles, traps, and a time target.',
		layman:
			'Think of exam day as a bank run with a clock: grab every guaranteed note fast (formula questions), skip the vault on the first pass, come back with a timer, and never walk out with an unmarked bubble — wrong answers cost nothing, blanks cost a mark.',
		pattern:
			'DAILY FLOOR: 2 blocks — one technical (35–45 timed MCQs) + one Part-A timed set; plus 15 min rolling GK.\nWEEKLY: one sectional in Phase 2, one full mock in Phase 3 — same time-of-day as the real slot.\nPHASES: 0 systems (week 1) → 1 foundation + PYQ scan (days 1–30) → 2 speed conversion (31–60) → 3 mock ladder (61–90).\nTARGET: Tech 50–55 + Eng/Reas 31–33 + Apt 13–14 + GK 8–9 = 112–115/120. UR cutoff: 103 (2023) → 108 (2025); trend saturates ~112–116.\nRULE ZERO: attempt all 120. Omission is the only fatal error.',
		complexity: 'Target: daily floor 2 blocks · exam-ready = 3 consecutive mocks ≥110',
		links: [
			{ kind: 'docs', label: 'AAI Recruitment Dashboard (next Advt appears here)', href: 'https://aai.aero/en/careers/recruitment' },
			{ kind: 'read', label: 'AAI JE ATC syllabus (official Part A/B split)', href: 'https://testbook.com/aai-je-atc/syllabus' },
			{ kind: 'paper', label: 'Exam analyses 2021–2025 (Testbook)', href: 'https://testbook.com/aai-je-atc/exam-analysis' },
		],
	},

	'atc::maths · calculus (integration & differentiation)': {
		blurb:
			'The engine of Part B: 6–8 questions every year (7–8 in the Feb-2023 shift, 6–7 in the other) — more than any other Maths topic. AAI formulates in two styles: standard-form recognition (evaluate a named integral/derivative) and application (area bounded by curves). Own the 12 standard integrals and the differentiate-back check, and most of this block is Layer-1/2 marks at 10–45 seconds.',
		layman:
			'Integration is reverse differentiation. The exam does not test cleverness — it tests whether you instantly recognise the shape of the integrand and name the standard result. The one twist AAI loves: a √ expression containing log x — substitute t = log x and it collapses to a standard form.',
		pattern:
			'STANDARD INTEGRALS (memorise cold):\n∫xⁿ dx = xⁿ⁺¹/(n+1)+C (n≠−1) · ∫dx/x = ln|x|+C · ∫eˣ dx = eˣ+C\n∫sin x dx = −cos x+C · ∫cos x dx = sin x+C · ∫sec²x dx = tan x+C\n∫dx/(a²+x²) = (1/a)·tan⁻¹(x/a)+C · ∫dx/√(a²−x²) = sin⁻¹(x/a)+C\n∫dx/(a²−x²) = (1/2a)·ln|(a+x)/(a−x)|+C · ∫dx/(x²−a²) = (1/2a)·ln|(x−a)/(x+a)|+C\n∫dx/√(x²+a²) = ln|x+√(x²+a²)|+C · ∫dx/(x√(x²−a²)) = (1/a)·sec⁻¹(x/a)+C\n∫√(a²−x²)dx = (x/2)·√(a²−x²) + (a²/2)·sin⁻¹(x/a)+C\n\nDERIVATIVES: d(sinx)=cosx · d(cosx)=−sinx · d(tanx)=sec²x · d(lnx)=1/x · d(eˣ)=eˣ\nd(tan⁻¹x)=1/(1+x²) · d(sin⁻¹x)=1/√(1−x²)\nRules: (uv)′ = u′v+uv′ · (u/v)′ = (u′v−uv′)/v² · chain: dy/dx = dy/du · du/dx\n\nTHE AAI FAVOURITE: ∫√(a²−(log x)²)/x dx → substitute t = log x, dt = dx/x → becomes ∫√(a²−t²)dt (standard form above).\n\nAPPLICATION: area under curve = ∫y dx over the interval. Worked example: area between y²=4ax and its latus rectum (x=a) = 2·∫₀ᵃ 2√(ax)dx = (8/3)a².\n\nTRAPS: domain-check every √ before integrating (expression under root ≥ 0); verify answers by differentiating back; if no standard form matches in 15 s it is Layer 3 — park for Pass 2.',
		complexity: 'Target: standard-form ≤30 s/Q · application ≤90 s · PYQ re-solve ≤45 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Maths (Ch 5–8: continuity, derivatives, integrals)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'read', label: 'Khan Academy: Calculus 1', href: 'https://www.khanacademy.org/math/calculus-1' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers (drill chapter-wise)', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · vectors & 3-d geometry': {
		blurb:
			'3–4 questions in every recent cycle (4 in 2021 and in both 2023 shifts) — one of the most reliable blocks. AAI asks: dot/cross evaluation, angles, projections, area from |a×b|, the collinearity-of-position-vectors puzzle (solve for the unknown), and concept checks on divergence/curl. All formula-driven — Layer 1 and 2 marks.',
		layman:
			'A vector is an instruction: how far, which way. The dot product asks how much two instructions agree; the cross product asks how much they disagree in direction — and its size is the area of the parallelogram they draw. Collinearity questions are just: is one displacement a stretched copy of the other?',
		pattern:
			'DOT: a·b = |a||b|cosθ = a₁b₁+a₂b₂+a₃b₃ → perpendicular ⇔ a·b = 0 · cosθ = a·b/(|a||b|) · projection of a on b = (a·b)/|b|\nCROSS: a×b = det[i j k; a₁ a₂ a₃; b₁ b₂ b₃] · |a×b| = |a||b|sinθ = area of parallelogram (triangle = ½ of it) · parallel ⇔ a×b = 0 (a = λb)\nSCALAR TRIPLE: [a b c] = a·(b×c) = det of the 3×3 of components → volume of parallelepiped; [a b c] = 0 ⇒ coplanar.\nVECTOR TRIPLE: a×(b×c) = (a·c)b − (a·b)c.\nCOLLINEAR PYQ: position vectors r₁, r₂, r₃ collinear ⇔ (r₂−r₁) = λ(r₃−r₁) — equate components, solve the unknown.\nUNIT VECTOR: â = a/|a| · distance = |r₂−r₁|.\nCONCEPT PYQs: divergence ∇·F = outflow; curl ∇×F = rotation; ∇×(∇f) = 0; ∇·F = 0 ⇒ solenoidal field.',
		complexity: 'Target: dot/cross numeric ≤45 s · collinearity ≤90 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Maths (Ch 10–11: Vector Algebra, 3-D)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'read', label: 'Khan Academy: Linear algebra (vectors)', href: 'https://www.khanacademy.org/math/linear-algebra' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · probability & counting': {
		blurb:
			'1–2 questions per recent cycle. Formulations stay elementary: dice, cards, coins, balls with/without replacement, at-least-one, simple conditionals. The skill is defining the sample space cleanly and counting favourable cases — no advanced theorems have appeared in any AAI shift.',
		layman:
			'Probability = what you want ÷ everything possible. The whole game is counting both honestly (order matters or not, replaced or not) and not double-counting overlaps. At-least-one questions are fastest from the back door: 1 minus the chance of none.',
		pattern:
			'BASE: P(A) = favourable/total · 0 ≤ P ≤ 1 · P(not A) = 1−P(A)\nADDITION: P(A∪B) = P(A)+P(B)−P(A∩B); mutually exclusive ⇒ P(A∩B) = 0\nMULTIPLICATION: independent ⇒ P(A∩B) = P(A)·P(B); conditional: P(A|B) = P(A∩B)/P(B)\nAT LEAST ONE in n tries: P = 1 − P(none) = 1 − (1−p)ⁿ\nWITHOUT replacement: multiply the shrinking fractions (two kings: 4/52 × 3/51 = 1/221) · WITH replacement: the fraction repeats.\nBASE RATES: P(king) = 4/52 = 1/13 · two dice: 36 outcomes, P(sum 7) = 6/36 = 1/6 · selections nCr = n!/(r!(n−r)!)\nMETHOD: (1) count the sample space, (2) count favourable, (3) reduce the fraction.',
		complexity: 'Target: ≤45 s/Q',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Maths (Ch 13: Probability)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'read', label: 'Khan Academy: Statistics & probability', href: 'https://www.khanacademy.org/math/statistics-probability' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · trigonometry': {
		blurb:
			'2–3 questions, almost always direct recall: evaluate cos(a+b) or sin2A at standard angles, simplify an identity, or one height-and-distance tan. With the values table and compound-angle sheet memorised, these are 10–15 second Layer-1 marks.',
		layman:
			'Trig values are coordinates of points on a circle at special angles; compound formulas tell you where you land when two such angles combine. Nothing here needs derivation in the exam — only recall.',
		pattern:
			'VALUES (sin): 0°→0, 30°→1/2, 45°→1/√2, 60°→√3/2, 90°→1 (cos reads the same list backwards; tan = sin/cos).\nCORE: sin²x+cos²x = 1 · 1+tan²x = sec²x · 1+cot²x = cosec²x\nCOMPOUND: sin(A±B) = sinA·cosB ± cosA·sinB · cos(A±B) = cosA·cosB ∓ sinA·sinB · tan(A±B) = (tanA±tanB)/(1∓tanA·tanB)\nDOUBLE: sin2A = 2sinA·cosA · cos2A = cos²A−sin²A = 1−2sin²A = 2cos²A−1 · tan2A = 2tanA/(1−tan²A)\nTRIPLE: sin3A = 3sinA−4sin³A · cos3A = 4cos³A−3cosA\nWORKED PYQ: cos(30°+45°) = (√3/2)(1/√2) − (1/2)(1/√2) = (√3−1)/(2√2)\nHeights & distances (when mixed in): angle of elevation → tanθ = height/distance; sketch first.',
		complexity: 'Target: recall ≤15 s/Q',
		links: [
			{ kind: 'read', label: 'NCERT Class 11 Maths (Ch 3: Trigonometric Functions)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'read', label: 'Khan Academy: Trigonometry', href: 'https://www.khanacademy.org/math/trigonometry' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · matrices & determinants': {
		blurb:
			'1–2 questions, and AAI has a favourite: find the value of a for which the matrix is singular — set the determinant to zero and solve. The rest is 3×3 determinant evaluation and adjoint/inverse identity recall.',
		layman:
			'A determinant is one number that summarises a square grid; zero means the grid squashes flat (no inverse). Singular questions are literally: compute the determinant, write = 0, solve for the letter.',
		pattern:
			'3×3 DETERMINANT: expand along any row/column (cofactor signs alternate) · shortcuts: a row of zeros or two identical rows ⇒ det = 0 · swapping two rows flips the sign · multiplying a row by k multiplies det by k.\nPROPERTIES: |Aᵀ| = |A| · |AB| = |A||B| · triangular ⇒ product of diagonal.\nADJOINT/INVERSE: A·(adjA) = |A|·I · |adjA| = |A|ⁿ⁻¹ (3×3: |adjA| = |A|²) · A⁻¹ = adjA/|A|, exists iff |A| ≠ 0.\n2×2 INVERSE: [a b; c d]⁻¹ = (1/(ad−bc))·[d −b; −c a] — swap diagonal, negate off-diagonal, divide by det.\nSINGULAR PYQ: det[a 2; 3 a] = a²−6 = 0 ⇒ a = ±√6 — the exam reuses this skeleton.\nSYSTEMS (Cramer): x = Dₓ/D · unique if D≠0 · infinitely many if D=0 and all minors 0 · inconsistent if D=0 and any minor ≠0.',
		complexity: 'Target: 3×3 determinant ≤60 s · singular-solve ≤45 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Maths (Ch 4: Determinants)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · complex numbers, quadratic & coordinate basics': {
		blurb:
			'Class-11 chapters the official syllabus includes but candidates skip: complex numbers (3–4 PYQs), quadratic/algebra (3–4), straight lines & 3-D (3–4), P&C + binomial (2–3). All short evaluation questions — modulus/argument, discriminant conditions, slope relations, general term. These are quick Layer-1/2 marks once the four mini-formula sets are memorised.',
		layman:
			'A complex number is a point on a plane — its modulus is the distance from zero, its argument the direction angle. A quadratic’s discriminant is a root-weather-report: positive means two real roots, zero means a double root, negative means none. Coordinate geometry is slope bookkeeping.',
		pattern:
			'COMPLEX: i² = −1 (i powers cycle every 4) · z = a+ib · |z| = √(a²+b²) · z̄ = a−ib · z·z̄ = |z|² · 1/z = z̄/|z|² · arg z = tan⁻¹(b/a) · |z₁z₂| = |z₁||z₂|\nQUADRATIC ax²+bx+c: D = b²−4ac · roots = (−b ± √D)/2a · sum = −b/a, product = c/a · real roots ⇔ D ≥ 0 (the PYQ: "find k such that roots are real" → set D ≥ 0) · equal roots ⇔ D = 0\nSTRAIGHT LINES: slope m = (y₂−y₁)/(x₂−x₁) = tanθ · point-slope y−y₁ = m(x−x₁) · intercept form x/a + y/b = 1 · parallel m₁ = m₂ · perpendicular m₁·m₂ = −1 · distance from point to line = |ax₀+by₀+c|/√(a²+b²)\nBINOMIAL: (a+b)ⁿ has n+1 terms · general term T(r+1) = C(n,r)·aⁿ⁻ʳ·bʳ · coefficients sum = 2ⁿ · middle term for even n = T(n/2+1)\nP&C (feeds probability): nPr = n!/(n−r)! arrangements · nCr = n!/(r!(n−r)!) selections',
		complexity: 'Target: ≤45 s/Q — short evaluation questions',
		links: [
			{ kind: 'read', label: 'NCERT Class 11 Maths (Complex Numbers, Quadratic, Straight Lines, Binomial)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · sets, relations & functions': {
		blurb:
			'2–3 questions in two flavours: Venn-cardinality word problems (students/games/languages) and definition checks (which relation is an equivalence, is f one-one/onto). Pure method, zero calculation load.',
		layman:
			'Sets are buckets; the union formula prevents double-counting people in two buckets. Relations ask whether a rule is fair in three specific ways (reflexive, symmetric, transitive); functions ask whether every input maps cleanly and uniquely.',
		pattern:
			'TWO SETS: n(A∪B) = n(A)+n(B)−n(A∩B)\nTHREE SETS: n(A∪B∪C) = Σn(each) − Σn(pairs) + n(all three)\nexactly two = Σ(pairs) − 3·n(all three) · exactly one = Σ(each) − 2·Σ(pairs) + 3·n(all three)\nDE MORGAN: (A∪B)′ = A′∩B′ · (A∩B)′ = A′∪B′ · subsets of an n-element set = 2ⁿ\nRELATIONS: reflexive (aRa) · symmetric (aRb ⇒ bRa) · transitive (aRb, bRc ⇒ aRc) · equivalence = all three. PYQ: test a small concrete relation against the three definitions.\nFUNCTIONS A→B (m→n): total = nᵐ · one-one = P(n,m) if n ≥ m · bijections (m=n) = m! · one-one ⇔ f(x₁)=f(x₂) ⇒ x₁=x₂ · onto ⇔ range = codomain.',
		complexity: 'Target: ≤45 s/Q',
		links: [
			{ kind: 'read', label: 'NCERT Class 11–12 Maths (Sets; Relations & Functions)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::maths · limits, continuity & differential equations': {
		blurb:
			'1–2 questions each for limits and DEs across recent cycles. Limits are standard-limit recognition or one L’Hôpital step; continuity is usually find-k-in-a-piecewise-function; DEs are variable-separable or first-order linear. Solve-and-integrate, then verify by substitution.',
		layman:
			'A limit asks where a function is heading, not where it lands. Continuity means the heading equals the actual value. A differential equation is a slope recipe — undo it by integrating; the constant of integration gives a family of solutions.',
		pattern:
			'STANDARD LIMITS: lim(x→0) sinx/x = 1 · tanx/x = 1 · (1−cosx)/x² = 1/2 · (eˣ−1)/x = 1 · (aˣ−1)/x = ln a · ln(1+x)/x = 1 · (1+x)^(1/x) → e\n0/0 or ∞/∞ → L’Hôpital: differentiate numerator and denominator separately, then take the limit.\nCONTINUITY at c: LHL = RHL = f(c) — piecewise PYQs equate the two branch limits at the joint and solve for k.\nDE VARIABLE-SEPARABLE: dy/dx = f(x)·g(y) ⇒ ∫dy/g(y) = ∫f(x)dx · PYQ family: dy/dx = y/x ⇒ y = Cx\nDE LINEAR: dy/dx + Py = Q → IF = e^(∫P dx) → y·IF = ∫Q·IF dx\nCHECK: substitute your solution back into the DE before finalising.',
		complexity: 'Target: limit ≤60 s · DE ≤90 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Maths (Ch 5–6, 9: Continuity, Derivatives, DEs)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · units, dimensions & measurement': {
		blurb:
			'1–2 questions, and they are the cheapest marks in Physics: dimensional correctness of an equation, dimensions of a constant (Planck’s h, G), or a percentage-error chain. Dimensional analysis is also the paper-wide pacing tool — it kills half the wrong options before any algebra.',
		layman:
			'Every physical quantity is built from three blocks: mass M, length L, time T. An equation is only legal if both sides are built from the same blocks in the same amounts — a free correctness check that needs no physics knowledge at all.',
		pattern:
			'DIMENSIONS: Force = MLT⁻² · Energy/Work = ML²T⁻² · Power = ML²T⁻³ · Pressure = ML⁻¹T⁻² · Momentum = MLT⁻¹ · Planck h = ML²T⁻¹ · G = M⁻¹L³T⁻² · Surface tension = MT⁻² · frequency T⁻¹, velocity LT⁻¹, acceleration LT⁻².\nUSES: (1) check an equation — both sides must match; (2) derive scaling (T = 2π√(l/g) type); (3) convert units: n₂ = n₁·(M₁/M₂)ᵃ(L₁/L₂)ᵇ(T₁/T₂)ᶜ for X = MᵃLᵇTᶜ.\nERRORS: least count = smallest scale division · for X = aᵖ·b^q/cʳ → ΔX/X = p(Δa/a)+q(Δb/b)+r(Δc/c) — powers become multipliers.\nPYQ CHAIN: g from T = 2π√(l/g) → Δg/g = Δl/l + 2·ΔT/T (the squared quantity counts double).\nTRAP: angles, strain and ratios are dimensionless — no units, but they still matter in the algebra.',
		complexity: 'Target: ≤30 s/Q — bank and move',
		links: [
			{ kind: 'read', label: 'NCERT Class 11 Physics (Ch 1–2: Units, Measurement, Errors)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · mechanics & gravitation': {
		blurb:
			'3–5 questions: kinematics graphs, Newton’s laws with friction, work-energy-power, and gravitation variations. The recurring AAI signature is the potential-gradient question — an electron released where V = 200 − 50x — which is mechanics wearing electrostatics: differentiate V, take E, then a = qE/m.',
		layman:
			'Kinematics predicts where things land from how speed changes; Newton says push = mass × response; energy bookkeeping (KE ↔ PE) shortcuts problems where forces get messy. Gravity questions are all about how g weakens as you go up or down.',
		pattern:
			'KINEMATICS: v = u+at · s = ut+½at² · v² = u²+2as · slope of s–t = v · slope of v–t = a · area under v–t = s.\nPOTENTIAL-GRADIENT PYQ: V = 200−50x volts → E = −dV/dx = 50 V/m (uniform) → a = qE/m for the electron = (1.6×10⁻¹⁹×50)/(9.1×10⁻³¹) ≈ 8.8×10¹² m/s².\nNLM: ΣF = ma · friction ≤ μN · incline: a = g(sinθ − μcosθ) down the slope · pulleys: same rope ⇒ same speed.\nWEP: W = F·d·cosθ · KE = ½mv² · PE = mgh · P = W/t = F·v · work–energy theorem: net W = ΔKE.\nGRAVITATION: F = Gm₁m₂/r² · g = GM/R² · at height h (h ≪ R): g(h) = g(1−2h/R) · at depth d: g(d) = g(1−d/R) · escape v = √(2GM/R) ≈ 11.2 km/s · orbital v = √(GM/r) = v_esc/√2 · Kepler III: T² ∝ r³.\nCOLLISIONS: momentum always conserved; elastic collisions also conserve KE.',
		complexity: 'Target: plug-style ≤45 s · graph reads ≤60 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 11 Physics (Ch 3–8: Kinematics through Gravitation)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'read', label: 'Khan Academy: Physics (forces & motion)', href: 'https://www.khanacademy.org/science/physics' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · electrostatics & capacitance': {
		blurb:
			'2–4 questions every cycle, dominated by Gauss law (the charge-q-inside-a-surface → flux template), uniform-field potential (V = Ed), and capacitor arithmetic. Two real AAI questions: 12 nC inside a closed surface → Φ ≈ 1.36×10³ N·m²/C, and E = 500 V/m with ΔV = 20 V → distance 4 cm.',
		layman:
			'Charges make an invisible field around them. Gauss law is the accounting rule: however you shape the bag, the total field through it depends only on the charge inside. Capacitors are charge buckets — geometry decides capacity, voltage decides how full.',
		pattern:
			'COULOMB: F = kq₁q₂/r² (k = 9×10⁹ N·m²/C²) · FIELD: E = F/q · point charge E = kq/r², radial away from +.\nGAUSS: Φ = ∮E·dA = q_enc/ε₀ — shape-independent · PYQ: Φ = 12×10⁻⁹/8.85×10⁻¹² ≈ 1.36×10³ N·m²/C.\nSHAPES: shell — inside 0, outside kQ/r² · solid sphere — inside E ∝ r (E = kQr/R³) · infinite wire — E = λ/(2πε₀r) · infinite sheet — E = σ/(2ε₀), distance-independent.\nPOTENTIAL: V = kq/r · UNIFORM FIELD: V = Ed → PYQ: d = V/E = 20/500 = 0.04 m = 4 cm.\nEQUIPOTENTIALS ⊥ E · work along one = 0 · W = qΔV.\nCAPACITANCE: C = Q/V · parallel plate C = ε₀A/d · dielectric κ: C′ = κC · series 1/C = Σ1/Cᵢ (same Q) · parallel C = ΣCᵢ (same V) · energy U = ½CV² = Q²/2C = ½QV.',
		complexity: 'Target: Gauss/V=Ed templates ≤45 s · capacitor networks ≤90 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 1–2: Charges, Fields, Potential, Capacitance)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'read', label: 'Khan Academy: Electric charge & field', href: 'https://www.khanacademy.org/science/physics' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · current electricity': {
		blurb:
			'1–3 questions: Ohm’s-law chains, series/parallel reduction, KVL/KCL on small two-loop circuits, cells with internal resistance, and I²R heating. AAI keeps networks small — the failure mode is a sign slip, not a concept gap.',
		layman:
			'Current is river flow in a circuit of pipes. Series = one path (same current everywhere); parallel = shortcuts (same voltage across). KVL is energy bookkeeping around a loop; KCL is flow conservation at a junction.',
		pattern:
			'OHM: V = IR · R = ρL/A (double length doubles R; halve the area doubles R) · drift: I = neAv_d.\nSERIES: R = ΣRᵢ (same I) · PARALLEL: 1/R = Σ1/Rᵢ (same V) · n identical R in parallel ⇒ R/n.\nKVL: ΣΔV around any loop = 0 · KCL: current in = current out at every node.\nCELL: terminal V = ε − Ir (discharging) · ε + Ir (charging) · short-circuit current = ε/r · max power transfer when R_load = r.\nPOWER: P = VI = I²R = V²/R — pick the form matching what is shared (series: same I → use I²R; parallel: same V → use V²/R).\nTWO-LOOP METHOD: name loop currents, write one KVL per loop, solve the 2×2 — under 90 s with practice.',
		complexity: 'Target: reduction ≤45 s · two-loop ≤90 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 3: Current Electricity)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · magnetic effects & emi': {
		blurb:
			'The swingiest high-weightage block: 1–2 questions in 2023 but 6–7 in the 2022 shift-1 analysis. Recurring skeletons: solenoid field B = μ₀nI, force on a charge or wire, Fleming-rule direction questions, and Faraday/Lenz flux-change numerics. Direction questions reward having both hand-rules automatic — they are pure reflex.',
		layman:
			'Moving charge makes magnetism; changing magnetic flux makes electricity. There are only three field formulas (wire, loop, solenoid) and two hand rules — left hand for force on current, right hand for induced current.',
		pattern:
			'SOURCES: straight wire B = μ₀I/2πr · loop centre B = μ₀NI/2R · solenoid B = μ₀nI (n = turns PER METRE — the N-vs-n trap) · μ₀ = 4π×10⁻⁷ T·m/A.\nFORCE ON CHARGE: F = qvB sinθ → perpendicular entry ⇒ circle, radius r = mv/(qB) · F = 0 when v ∥ B.\nFORCE ON WIRE: F = BIL sinθ · parallel wires: F/L = μ₀I₁I₂/2πd — same direction attracts.\nRULES: Fleming LEFT hand = force on current-carrying conductor · Fleming RIGHT hand = induced current in a moving conductor.\nEMI: Φ = B·A·cosθ · Faraday ε = −N·dΦ/dt (minus = Lenz: induced effects oppose the change) · motional emf ε = Blv.\nINDUCTANCE: e = −L·dI/dt · solenoid L = μ₀n²Al.\nFLUX PYQ METHOD: Φ before → Φ after → divide by Δt → multiply by N → direction by Lenz.',
		complexity: 'Target: field/force plug ≤45 s · flux-change ≤75 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 4–6: Moving Charges, Magnetism, EMI)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · electromagnetic waves': {
		blurb:
			'3–5 questions and remarkably repetitive: which equation showed electricity, magnetism and light are one field (Maxwell), spectrum ordering with uses, E₀/B₀ = c conversions, and intensity numerics. Layer 1/2 — pure recall and one-formula plugs.',
		layman:
			'A changing electric field makes a magnetic field and vice versa — the two dance forward together as a wave, and light is that wave. Maxwell’s equations are the choreography; the spectrum is the same dance at different tempos.',
		pattern:
			'MAXWELL: displacement current I_d = ε₀·dΦ_E/dt completes Ampère–Maxwell law — the unification of electricity, magnetism and optics (the recurring concept PYQ: answer = Maxwell’s equations).\nSPEED: c = 1/√(μ₀ε₀) ≈ 3×10⁸ m/s · in a medium v = 1/√(με) · transverse wave: E ⊥ B ⊥ propagation · E₀/B₀ = c → B₀ = E₀/c.\nSPECTRUM (increasing frequency): radio < microwave < IR < visible (≈400–700 nm) < UV < X-rays < γ.\nANCHORS: radio—communication · microwave—radar/ovens · IR—remotes/night vision · UV—sterilisation · X-ray—medical imaging · γ—nuclear.\nINTENSITY: I = ½ε₀E₀²c = E₀²/(2μ₀c) · radiation pressure I/c absorbed, 2I/c reflected.\nNUMERIC PYQ: E₀ = 60 V/m → B₀ = E₀/c = 2×10⁻⁷ T.',
		complexity: 'Target: ≤30 s/Q',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 8: Electromagnetic Waves)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · heat & thermodynamics': {
		blurb:
			'2–5 questions: first-law bookkeeping, process comparisons on P–V graphs (which path does more work), Carnot efficiency, and kinetic-theory one-liners (v_rms, degrees of freedom). The 2021 tricky set sat here; the graph work is the Layer-3 part.',
		layman:
			'Thermodynamics is energy accounting for gases: heat either raises temperature (ΔU) or buys expansion work (W) — it never vanishes. The P–V graph is the payslip: the area under the path is the work done.',
		pattern:
			'FIRST LAW: ΔU = Q − W (W = work done BY the gas) · ΔU = n·Cv·ΔT in EVERY process.\nHEAT CAPACITIES: Cv = (f/2)R (f = degrees of freedom: monoatomic 3, diatomic 5) · Cp = Cv + R · γ = Cp/Cv = (f+2)/f → mono 5/3, diatomic 7/5.\nPROCESSES: isothermal — ΔU = 0, W = nRT·ln(V₂/V₁) · adiabatic — Q = 0, PV^γ = const, W = nR(T₁−T₂)/(γ−1) · isobaric — W = pΔV = nRΔT · isochoric — W = 0.\nGRAPH SKILL: adiabat is steeper than isotherm through the same point (γ > 1) · W = area under the curve · clockwise cycle ⇒ net work done by the gas.\nENGINES: η = 1 − Q_out/Q_in ≤ 1 − Tc/Th (Carnot ceiling, kelvins only) · refrigerator COP = Tc/(Th−Tc).\nKINETIC THEORY: PV = ⅓·N·m·v²_rms · v_rms = √(3RT/M) · average KE per molecule = (3/2)kT (temperature only).',
		complexity: 'Target: one-law plug ≤45 s · process comparison ≤90 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 11 Physics (Thermodynamics & Kinetic Theory chapters)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · optics': {
		blurb:
			'2–4 questions with rising emphasis (2025 listed optics among the tricky blocks). Recurring: mirror/lens numerics with sign discipline, total internal reflection, and Young’s double-slit fringe width β = λD/d. Sign conventions are where marks die — drill them before any solving.',
		layman:
			'Mirrors bounce light, lenses bend it; both reduce to one formula each, and the trap is never the formula — it is the signs. Wave optics adds interference: two slits paint alternating bright/dark stripes whose spacing is one formula.',
		pattern:
			'MIRROR (Cartesian): 1/v + 1/u = 1/f · u negative for a real object · f negative (concave) / positive (convex) · m = −v/u (m < 0 ⇒ real, inverted).\nLENS (thin): 1/v − 1/u = 1/f · convex f > 0, concave f < 0 · m = v/u · power P = 1/f (metres) in dioptres · in contact: P = P₁+P₂ · lens-maker: 1/f = (n−1)(1/R₁ − 1/R₂).\nREFRACTION: n₁sinθ₁ = n₂sinθ₂ · TIR (denser→rarer) when θ > θ_c, sinθ_c = 1/n · apparent depth = real depth/n · prism minimum deviation: n = sin((A+D_m)/2)/sin(A/2).\nWAVE OPTICS: YDSE β = λD/d (independent of fringe order) · bright at path difference nλ · dark at (2n−1)λ/2.\nPOLARISATION: only transverse waves polarise — Malus I = I₀cos²θ · Brewster tanθ_B = n · sound cannot polarise.',
		complexity: 'Target: sign-correct solve ≤60 s · β plug ≤30 s',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 9–10: Ray Optics, Wave Optics)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · modern physics': {
		blurb:
			'2–4 questions: photoelectric numerics, de Broglie wavelength, Bohr energies/radii, and nuclear binding energy. These are the most templated questions in the paper — the same five formulas with changed numbers.',
		layman:
			'Light acts like packets (photons) and matter acts like waves — that is the whole of modern physics. The formulas convert between the packet picture (frequency, energy) and the wave picture (wavelength, momentum).',
		pattern:
			'PHOTOELECTRIC: hf = φ + K_max (φ = work function) · stopping potential: eV₀ = K_max · threshold f₀ = φ/h\nintensity ↑ → more electrons (same K_max) · frequency ↑ → higher K_max (same count) — never the reverse.\nDUAL NATURE: λ = h/p (h = 6.63×10⁻³⁴ J·s) · p = √(2mK) · electron through V volts: λ = 12.27/√V Å.\nBOHR (hydrogen): Eₙ = −13.6/n² eV · rₙ = 0.529 n² Å · vₙ ∝ 1/n · transition: ΔE = 13.6(1/n₁² − 1/n₂²) eV · Lyman → UV (ends n=1), Balmer → visible (ends n=2).\nNUCLEI: BE = Δm × 931.5 MeV (Δm in u) · BE per nucleon peaks near Fe-56 · decay N = N₀e^(−λt) · half-life t½ = 0.693/λ.\nMETHOD: identify which of the five formulas the numbers belong to, substitute, keep powers of ten tidy.',
		complexity: 'Target: ≤45 s/Q',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 11–13: Dual Nature, Atoms, Nuclei)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::physics · semiconductors & devices': {
		blurb:
			'1–3 questions: rectifier output frequency, logic-gate truth tables, transistor α/β conversion, and special-diode roles (Zener/LED/photodiode). Definitions and tiny computations only — a guaranteed Layer-1 bank once the truth tables are memorised.',
		layman:
			'Semiconductors are traffic controllers for current: a diode is a one-way valve (that is a rectifier), a transistor is an electronic lever, and logic gates are tiny yes/no machines. Every question here is a rule lookup, not a derivation.',
		pattern:
			'TYPES: intrinsic n_e = n_h · n-type = pentavalent donor (electrons majority) · p-type = trivalent acceptor (holes majority).\nP–N JUNCTION: barrier ≈ 0.7 V (Si), 0.3 V (Ge) · forward: conducts after the knee · reverse: tiny saturation current, then breakdown.\nRECTIFIERS: half-wave (1 diode) → output frequency = f · FULL-WAVE (2 or 4 diodes) → output = 2f — the classic PYQ (50 Hz mains → 100 Hz ripple).\nSPECIAL DIODES: Zener = reverse-breakdown voltage regulator · LED = forward-biased, λ = hc/E_g · photodiode = reverse-biased light sensor.\nTRANSISTOR: α = Ic/Ie (≈0.95–0.99) · β = Ic/Ib (≈50–200) · β = α/(1−α) — PYQ: α = 0.96 → β = 24.\nLOGIC: AND (1 only if both 1) · OR (0 only if both 0) · NOT (flip) · NAND/NOR are universal — evaluate combination gates input-by-input.',
		complexity: 'Target: ≤30 s/Q',
		links: [
			{ kind: 'read', label: 'NCERT Class 12 Physics (Ch 14: Semiconductor Electronics)', href: 'https://ncert.nic.in/textbook.php' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::part a · english': {
		blurb:
			'20 questions and the easiest section five years running (good attempts 15–18). Stable menu: cloze (up to 5), one RC passage (4–10 Qs), synonyms/antonyms, fillers, error spotting, idioms, one-word substitutions, sentence improvement — plus voice/narration pairs in the 2021 cycle. Speed here funds your Part-B thinking time.',
		layman:
			'This is not literature — it is pattern matching against standard grammar rules and stock word lists. RC answers live inside the passage, cloze answers live in the grammar around the blank, and vocab lives in your daily 10-word list.',
		pattern:
			'CLOZE/FILLERS — answer by grammar-fit, in this order: subject–verb agreement → tense chain → preposition/collocation → word form (noun/verb/adjective). Read the whole sentence first; eliminate options that break agreement.\nRC METHOD: read the questions FIRST, note keywords, then skim the passage for them. Answers are strictly in-text — never import outside knowledge. Extreme options (always/never/only) are usually wrong.\nERROR SPOTTING ORDER: SVA → tense → pronoun case → preposition/idiom → article → parallelism.\nVOICE: passive = object + be + V3 + by-agent.\nNARRATION: backshift the tense and shift pronouns/time words (this→that, now→then).\nVOCAB ENGINE: 10 synonyms/antonyms + 5 idioms + 5 one-word substitutions daily, on one revisable list.',
		complexity: 'Target: 40–50 s/Q · 18/20 in ≤18 minutes',
		links: [
			{ kind: 'read', label: 'AAI JE ATC exam analyses (English section patterns)', href: 'https://testbook.com/aai-je-atc/exam-analysis' },
			{ kind: 'practice', label: 'IndiaBIX verbal ability drills', href: 'https://www.indiabix.com/' },
		],
	},

	'atc::part a · reasoning': {
		blurb:
			'15 questions from a fixed menu: series, syllogism, coding-decoding, blood relations, direction, analogy, classification — and the time-hungry seating puzzles (2–7 Qs). Everything except puzzles is a 20–30 second win; puzzles get a 90-second cap and then park.',
		layman:
			'Reasoning here is pattern-spotting with letters and pictures, not philosophy. Series → look at gaps. Syllogism → draw circles. Relations → draw a family tree. Direction → draw a compass. Never solve these in your head.',
		pattern:
			'SERIES: test in order — constant difference → second-order difference → ratio → alternating twins · letters via positions A=1…Z=26.\nCODING-DECODING: EJOTY anchor (E=5, J=10, O=15, T=20, Y=25) · opposite letter = 27 − position · check shift / substitution / reversal.\nSYLLOGISM: draw every Venn possibility; a conclusion must hold in ALL of them · some A are B + all B are C ⇒ some A are C · no A is B ⇔ no B is A.\nBLOOD RELATIONS: symbol chain (+ male, − female) — build from the questioned person backwards.\nDIRECTION: sketch a compass at every turn · net displacement by Pythagoras · facing centre: anticlockwise = right.\nPUZZLES/SEATING (2–7 Qs): lock fixed-position clues first, then relative clues · 90 s cap, park if the chain does not open in 60 s.',
		complexity: 'Target: 45–60 s/Q · puzzles ≤90 s then park · 13–14/15 in ≤14 min',
		links: [
			{ kind: 'read', label: 'AAI JE ATC exam analyses (reasoning patterns)', href: 'https://testbook.com/aai-je-atc/exam-analysis' },
			{ kind: 'practice', label: 'IndiaBIX logical reasoning drills', href: 'https://www.indiabix.com/' },
		],
	},

	'atc::part a · numerical aptitude': {
		blurb:
			'15 SSC-style arithmetic questions: time & work (up to 4), profit & loss, percentages, ratio, SI/CI, TSD, mensuration, mixtures. Difficulty scales with calculation size, not concept — the fraction-percent table is the speed weapon.',
		layman:
			'Every one of these is a two-step recipe you already know; the exam only hides the numbers. Memorise fraction-percent pairs and the LCM work method, and the section becomes transcription.',
		pattern:
			'%↔FRACTION (instant recall): 1/2=50% · 1/3=33.33% · 1/4=25% · 1/5=20% · 1/6=16.67% · 1/8=12.5% · 1/9=11.11% · 1/12=8.33% · 1/16=6.25%\nTIME & WORK: LCM method — total work = LCM of the days · efficiency = work/day · A(x days) + B(y days) together = xy/(x+y) days · pipes: inlet +, outlet −.\nP&L: profit% on CP · SP = CP(1 ± p/100) · successive changes: a + b + ab/100 · discount is always on MP.\nSI/CI: SI = PRT/100 · A = P(1+r/100)ⁿ · CI−SI (2 yr) = P(r/100)² · (3 yr) = P(r/100)²(3 + r/100).\nTSD: relative speed = sum (opposite) / difference (same) · trains: lengths add · boats: down = b+s, up = b−s.\nMIXTURES: n replacements → final = initial·(1 − r/V)ⁿ · alligation: cheap:dear = (d−m):(m−c).\nRATIO: a:b = c:d ⇒ ad = bc · combine a:b and b:c through the LCM of b.',
		complexity: 'Target: 60–75 s/Q · 13–14/15 in ≤15 min',
		links: [
			{ kind: 'read', label: 'AAI JE ATC exam analyses (aptitude patterns)', href: 'https://testbook.com/aai-je-atc/exam-analysis' },
			{ kind: 'practice', label: 'IndiaBIX arithmetic drills', href: 'https://www.indiabix.com/' },
		],
	},

	'atc::part a · general knowledge & current affairs': {
		blurb:
			'10 questions: 2–4 from the last 6–12 months of current affairs, the rest static (polity, geography, history, science, awards). Two options are usually eliminable — GK is answered by elimination in ≤20 seconds, and never left blank.',
		layman:
			'You cannot out-read GK the week before. You can bank the fixed static core once, keep a rolling 6-month current-affairs sheet you reread weekly, and let elimination finish the job.',
		pattern:
			'POLITY CORE: key articles (14 equality · 19 freedoms · 21 life & liberty · 32 remedies · 243ZD district planning committee · 368 amendment) · 42nd Amendment 1976 (Fundamental Duties) · 73rd/74th (panchayats, 1993).\nGEOGRAPHY CORE: rivers ↔ cities/sites (Mohenjo-daro on the Indus) · national parks & bird sanctuaries ↔ states (Nal Sarovar → Gujarat) · dams ↔ rivers.\nHISTORY CORE: movement years (Dandi 1930, Quit India 1942) · presses & founders (Sambad Kaumudi — Raja Ram Mohan Roy) · Governor-Generals and their reforms.\nAWARDS & SPORTS: Bharat Ratna years (Sachin Tendulkar — 2014) · Nobel fields and Indian laureates · federations (International Judo Federation — 1951).\nSCIENCE ONE-LINERS: units, instruments, inventors at NCERT level.\nCURRENT AFFAIRS (2–4 Qs): schemes, appointments, summits, sports, indices — 15 min/day on a rolling last-6-months compilation + weekly re-read.\nEXAM CRAFT: eliminate the two far-fetched options first · never exceed 20 s · never leave a blank.',
		complexity: 'Target: ≤20 s/Q · 8–9/10',
		links: [
			{ kind: 'read', label: 'PIB (official current-affairs source)', href: 'https://pib.gov.in/' },
			{ kind: 'read', label: 'AAI JE ATC exam analyses (GK patterns)', href: 'https://testbook.com/aai-je-atc/exam-analysis' },
		],
	},

	'atc::speed system: drills, two-pass, error log': {
		blurb:
			'The operating system of the whole course: the 3-layer time budget, the 60-second law, the two-pass + park method, and the error-log buckets. Rehearsed in every drill until reflex — because Part A is locked before Part B and the clock never negotiates.',
		layman:
			'Fast questions first, always. Anything that smells like more than a minute gets parked and revisited. With no negative marking, an unanswered question is the only way to actually lose marks — a guess is a free lottery ticket.',
		pattern:
			'LAYER BUDGET (120 min): Layer 1 recall (40–50 Qs) at 10–15 s ≈ 11 min · Layer 2 plug-and-compute (35–40 Qs) at 45–60 s ≈ 32 min · Layer 3 concept (25–35 Qs) at 90–120 s ≈ 50 min · guess-fill + review ≈ 25 min.\n60-SECOND LAW: in Pass 1, no question gets more than 60 s. Speed on Layers 1+2 BUYS your Layer-3 time.\nTHREE PASSES: P1 (0–80 min) — Part A first (locked): Eng 18′ → Reas 13′ → Apt 14′ → GK 7′ ≈ 55 min for 55+/60, then Part-B bank at ≤60 s/Q. P2 (80–110) — parked Layer-3s, 2-min cap, confidence order. P3 (110–118) — guess-fill every blank + unit/sign checks.\nERROR LOG (every miss gets exactly one bucket): concept gap → relearn theory · speed loss → more Drill A/B there · silly error → unit/sign ritual · time trap → should have been parked.\nDRILLS: A — PYQ chapter-wise ≤45 s/Q, tagged Easy/Moderate/Tough · B — form/law flashcards ≤5 s · C — timed sectionals · D — full mocks with same-evening redo.\nSPEED CAPS: Eng 40–50 s · Reas 45–60 s (puzzle ≤90 s) · Apt 60–75 s · GK ≤20 s · Physics 10/45/90 s · Maths 15/60/120 s by layer.',
		complexity: 'Target: Part A ≤55 min for 55+/60 · Part B Pass-1 ≈22 min for 28–32 Qs',
		links: [
			{ kind: 'read', label: 'Exam analyses (layer/difficulty evidence)', href: 'https://testbook.com/aai-je-atc/exam-analysis' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers (Drill A fuel)', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::mock ladder, targets & notification watch': {
		blurb:
			'Mocks are the only honest scoreboard: expect 95–103 for the first three, 104–110 through M8, and a stable 110–115 for the final three. Three consecutive ≥110 is the exam-ready gate. The notification is external — watch aai.aero weekly; registration windows last ~30 days, so register the same day it drops.',
		layman:
			'Your mock score is a weather report, not a verdict — the first three tell you where the water is coming in. Fix the top-2 leak buckets each week and the score climbs on its own.',
		pattern:
			'LADDER: M1–M3 ≈ 95–103 → M4–M8 ≈ 104–110 → final 3 stable 110–115 (judge by the 3-mock rolling average; ±5 wobble early is normal).\nEXAM-READY GATE: 3 consecutive mocks ≥110 AND Part A closes ≤55 min AND the silly-error bucket ≤5 marks.\nMOCK PROTOCOL: real conditions (120 Q / 120 min, same time-of-day) · redo wrong + parked the same evening · update the error log before sleeping.\nFINAL 48 H: D-2 two light mocks + formula sheets · D-1 sheets once + sleep 7–8 h (no full mock) · exam morning: skim sheets 20 min, no outside-answer talk.\nCHECKPOINTS: @55 min Part A done (55+/60) · @80 min Pass-1 done · @110 min Pass-2 done → guess-fill · @118 verify flags only.\nON NOTIFICATION (first 72 h): verify post count/disciplines · pattern (120/120/120, Part A→B lock) · negative-marking status · eligibility → register same day → re-map phases (≥60 d continue / 30–60 d compress Phase 2 / <30 d Phase-3 only + GK blitz) → re-set the pass-mark (cutoff +2–4/cycle, capped ~112–116).\nTRIPWIRES: negative marking returning kills Pass-3 guessing (accuracy then filters attempts); a Part-B syllabus change resets weightages — re-derive the plan before continuing.',
		complexity: 'Target: final-3 mocks 110–115 stable · silly errors ≤5 marks',
		links: [
			{ kind: 'docs', label: 'AAI Recruitment Dashboard (watch weekly)', href: 'https://aai.aero/en/careers/recruitment' },
			{ kind: 'paper', label: 'AAI ATC 2025 question paper', href: 'https://prepp.in/aai-je-atc-exam/question-paper-2025' },
			{ kind: 'paper', label: 'AAI ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		],
	},

	'atc::the 120 campaign — the five laws': {
		blurb:
			'The course plays as a campaign. Your LEVEL is your latest full-mock score: you spawn at your baseline and level up only at full mocks (120 Q / 120 min) — 95, 104, 108, and the campaign is won at a stable 112. Weekly timed-drill marks are XP (target 40–60/week) that power you between bosses. Everything below is tracked live in Stride: class progress bars, heatmap streak, Revise cards.',
		layman:
			'An arcade run has three parts: fixed controls (the Daily Raid), a score you can see (the mock level), and continues when you fail (respawn, never restart). This course is the same design — which is why it is playable instead of merely readable.',
		pattern:
			'LAW 1 · THE DAILY RAID (3.5 h, five blocks): 60′ Theory Quest (1–2 Stride classes) → 60′ Numeric Arena (20 aptitude + 15 physics-plug + 10 maths-form, timed) → 30′ Part-A Drill (English/Reasoning alternating) → 20′ GK Vault → 15′ Damage Report.\nLAW 2 · LEVEL = MOCK SCORE: level moves only at full mocks; weekly XP = timed-drill marks, target 40–60.\nLAW 3 · THE STREAK IS SACRED: Stride heatmap is the counter; the floor is 1 completed block on the worst day; never two zero days.\nLAW 4 · THE DAMAGE REPORT: every miss gets exactly one bucket — concept gap / speed loss / silly error / time trap — and the top-2 buckets are fixed weekly. Boss results are judged by buckets, not feelings.\nLAW 5 · THE 60-SECOND LAW: Pass 1 at ≤60 s/Q, puzzles ≤90 s then park, guess-fill every blank at the end (no negative marking — blanks are the only real loss).\nRESPAWN RULE: missed a week → resume, never restart; a failed boss extends the act by 1–2 weeks; the ladder stays.',
		complexity: 'Target: 2 blocks/day · weekly XP 40–60 · never two zero days',
		links: [],
	},

	'atc::act i · foundation forge (weeks 1–8)': {
		blurb:
			'Act I forges Tier-1 everywhere before touching anything rare. The order follows the PYQ evidence: Physics opens with EM waves + the Modern cluster (3.9 + ~5 per shift), Maths with the calculus cluster (7.6/shift — a third of the section), Reasoning with series (3.6/shift, every shift), English with the grammar rule systems (3.4/shift), Aptitude with the fraction-% table. Tier-2 and Tier-3 chapters wait for Act II.',
		layman:
			'You are forging the weapons you will use for the whole campaign. Rushing rare chapters here is how runs die — the high-frequency chapters are the ones every future boss will attack you with.',
		pattern:
			'WK 1 · Awakening — baseline full mock + damage report + build the 3 formula sheets.\nWK 2 · EM waves + Modern cluster (Physics) · English connector map + SVA rules · fraction-% table week begins.\nWK 3 · Electrostatics + Current · the 4-step series check (30 series done) · GK static pair tables.\nWK 4 · Magnetism + EMI · Maths calculus cluster begins (15 standard forms) · coding 3 sub-patterns.\nWK 5 · Ray + wave optics · limits + definite-integral properties · T&W (LCM) + SI/CI shortcuts · RC method starts.\nWK 6 · Semiconductors · area-under-curve archetype · syllogism + blood relations · polity 10-article core.\nWK 7 · Vectors + 3-D (the 5.1/shift cluster) · number system (cyclicity, LCM-HCF) · sectional #1.\nWK 8 · BOSS 1 — Part-A sectional ≥45/60 in 55 min + a full mock; Tier-1 classes ≥80% complete in Stride.\nPASS CONDITION: both numbers. Fail → repeat the weakest 2 weeks of Act I, then re-challenge.',
		complexity: 'Target: exit Act I at Level 90–95 with Tier-1 forged',
		links: [],
	},

	'atc::act ii · speed dungeon (weeks 9–16)': {
		blurb:
			'Act II converts knowledge into speed. The remaining classes (matrices/dets, sets, mechanics, thermo, P&L/TSD/mensuration, cloze, seating discipline, GK geography) land here, and the sectional cadence begins — Saturday Tech, Sunday Part A, alternating. Drill B flashcards go daily: name the Maths form in ≤5 s, the Physics law in ≤5 s.',
		layman:
			'Act I taught you the moves; Act II drills them until they are reflexes. The dungeon is timed — every sectional is a run against the clock, and the error log is the map of where the walls are.',
		pattern:
			'WK 9–10 · Matrices/determinants + sets (Maths) · mechanics cluster + thermo (Physics) · cloze + rearrangement (English) · sectional cadence begins.\nWK 11–12 · Aptitude Tier-2 complete (P&L, TSD, mensuration, mixtures, partnership) · seating 90-s discipline + directions (Reasoning) · Drill B flashcards daily.\nWK 13–14 · GK geography lines/rivers + science one-liners + the aviation-adjacent sheet · English vocab machine at full spin · two-pass + park rehearsed in every sectional.\nWK 15 · Dress rehearsal — Part-A sectional ≥50/60 + Part-B sectional ≥40/60 · weak-class patching from the damage report.\nWK 16 · BOSS 2 — full mock ≥95.\nRESPAWN: below 90 → extend foundation by 2 weeks (skip-list unchanged), then re-challenge. Between 90–94 → patch the top-2 buckets and re-challenge immediately.',
		complexity: 'Target: exit Act II at Level 95+ · Part A ≥50/60 in sectionals',
		links: [],
	},

	'atc::act iii · mock arena (weeks 17–24)': {
		blurb:
			'Act III is the ladder: 95–103 → 104–110 → stable 108+. Two full mocks a week, same-evening redo of wrong and parked questions, and the Layer-3 cherry-pick list grows only from your six strongest chapters. No new chapters after Week 20; the last 10 days run on the CA sheet and pair tables alone.',
		layman:
			'The arena is where levels actually move. Lose, read the damage report, patch two buckets, climb again. 104 after 103 is the almost-there signal that keeps the run alive.',
		pattern:
			'WK 17–18 · Mock ladder 95–103 — two full mocks/week, same-evening redo of wrong + parked, error log before sleeping.\nWK 19–20 · BOSS 3 — mock ≥104 with Part A closed ≤55 min; silly-error bucket ≤5; all speed caps inside budget.\nWK 21–24 · FINAL BOSS — 3 consecutive mocks ≥108 · no new chapters after W20 · last-10-day protocol: CA sheet + pair tables only, no full mock the day before.\nNOTIFICATION WATCH: weekly dashboard check continues; when the Advt drops, run the first-72-h protocol (verify pattern + negative marking, register same day, re-map phases).\nJUDGE EVERY MOCK BY BUCKETS: concept → relearn · speed → Drill A/B · silly → unit/sign ritual · time-trap → should have been parked.',
		complexity: 'Target: 3 consecutive mocks ≥108 = Ascended · stretch 112',
		links: [],
	},

	'atc::achievement hall — 15 badges': {
		blurb:
			'Fifteen badges, each tied to a real, checkable event — claimed only when the evidence exists. Log the event in a Stride ticket or notes file when you earn one; the badge list doubles as the campaign trophy case. Badges are side quests: they reward the behaviours (streaks, clean sheets, zero blanks) that produce the level-ups.',
		layman:
			'Badges are the side quests that keep the main quest fun. None of them require talent — they require showing up and running the systems: the streak, the sheets, the drills, the park rule.',
		pattern:
			'🩸 First Blood — baseline mock + damage report completed.\n🔨 The Smith — 3 formula sheets built & in use.\n🗺️ Cartographer — all 25 classes opened & queued.\n🔥 Streak VII — 7-day heatmap streak.\n🌙 Streak XXX — 30-day heatmap streak.\n⚡ Series Slayer — 20/20 on a series sprint (all 3 kinds).\n🔓 Codebreaker — clean sweep on a mixed coding set.\n📜 Historian — history + polity + rivers tables complete.\n🧮 Table Wizard — fraction-% table under 30 s for all values.\n👻 The Ghost — a Part-A sectional with zero blanks in ≤55 min.\n🎯 L3 Assassin — 5+ Layer-3 questions correct in one mock.\n🛡️ Untouchable — silly-error bucket ≤2 in a full mock.\n💯 Century — first mock ≥100.\n🚪 Gatekeeper II — Week-16 boss cleared (mock ≥95).\n👑 Ascended — 3 consecutive mocks ≥108. Campaign won.',
		complexity: 'Claim rule: evidence first, badge second',
		links: [],
	},
};

export const ATC_TRACK_SOURCE: TopicGuide = {
	blurb:
		'Built from the verified AAI JE (ATC) record: official blueprint (120 Q / 120 min CBT, Part A locked before Part B, no negative marking in 2021+ cycles), coaching exam analyses for topic weightage (2021, 2023×2, 2025), and official aai.aero cutoff PDFs (UR 103.06 → 108.00). Theory lives in each class page — formula sheet, PYQ styles, traps, time target. NCERT Class 11–12 covers every formula that appears. The course now plays as a campaign: Level = mock score, three acts, four bosses, 15 badges — tracking lives in Stride\'s progress bars, heatmap and Revise.',
	layman:
		'Every class in this course has a Pattern note — the formulas, the exact PYQ styles AAI recycles, the traps, and a per-question time target. Open the class page before drilling, then produce: timed questions, not re-reading.',
	links: [
		{ kind: 'docs', label: 'AAI Recruitment Dashboard (watch for the next Advt)', href: 'https://aai.aero/en/careers/recruitment' },
		{ kind: 'paper', label: 'AAI JE ATC previous-year papers', href: 'https://testbook.com/aai-je-atc/previous-year-papers' },
		{ kind: 'paper', label: 'AAI ATC 2025 question paper', href: 'https://prepp.in/aai-je-atc-exam/question-paper-2025' },
		{ kind: 'practice', label: 'NCERT Class 11–12 textbooks (Physics & Maths)', href: 'https://ncert.nic.in/textbook.php' },
	],
};
