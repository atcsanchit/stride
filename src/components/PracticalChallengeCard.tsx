import type { PracticalChallenge } from '../lib/practical';

export function PracticalChallengeCard({
	challenges,
	compact = false,
}: {
	challenges: PracticalChallenge[];
	compact?: boolean;
}) {
	if (challenges.length === 0) {
		return null;
	}
	return (
		<section className="practical-block">
			<p className="eyebrow">Practical — build, test, push to GitHub</p>
			{challenges.map((challenge) => (
				<article key={challenge.section} className="practical-card">
					<strong>{challenge.section}</strong>
					{compact ? (
						<p>{challenge.build}</p>
					) : (
						<>
							<p>
								<strong>Build. </strong>
								{challenge.build}
							</p>
							<p>
								<strong>Test. </strong>
								{challenge.test}
							</p>
							<p>
								<strong>GitHub. </strong>
								{challenge.github}
							</p>
							<p className="muted">{challenge.source}</p>
						</>
					)}
				</article>
			))}
		</section>
	);
}
