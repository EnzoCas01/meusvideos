export type Point = { x: number; y: number };

// Deterministic cubic bezier evaluation (t in [0,1])
export const cubicBezier = (
	t: number,
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
): Point => {
	const mt = 1 - t;
	const x =
		mt * mt * mt * p0.x +
		3 * mt * mt * t * p1.x +
		3 * mt * t * t * p2.x +
		t * t * t * p3.x;
	const y =
		mt * mt * mt * p0.y +
		3 * mt * mt * t * p1.y +
		3 * mt * t * t * p2.y +
		t * t * t * p3.y;
	return {x, y};
};

// Samples a cubic bezier from t=0 up to t=progress, evenly spaced.
export const sampleBezier = (
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
	progress: number,
	steps = 80,
): Point[] => {
	const clamped = Math.max(0, Math.min(1, progress));
	const points: Point[] = [];
	const count = Math.max(1, Math.round(steps * clamped));
	for (let i = 0; i <= count; i++) {
		const t = (i / steps);
		points.push(cubicBezier(t, p0, p1, p2, p3));
	}
	return points;
};

export const pointsToPathD = (points: Point[]): string => {
	if (points.length === 0) return "";
	return points
		.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(" ");
};

// Seeded pseudo-random, deterministic across renders (no Math.random).
export const seededRandom = (seed: number): number => {
	const x = Math.sin(seed * 12.9898) * 43758.5453;
	return x - Math.floor(x);
};
