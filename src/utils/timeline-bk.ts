import {NARRATION_BK, wordBK} from "./narration-bk";

/** End of the film: last spoken clip plus the JSON tail — never hardcoded. */
const LAST_CLIP_BK = NARRATION_BK.lines.reduce(
	(acc, l) => Math.max(acc, l.frame + l.durationInFrames),
	0,
);
export const TOTAL_FRAMES_BK = LAST_CLIP_BK + NARRATION_BK.tailFrames;

/**
 * One scene per narration line, back to back — the voice is continuous, so
 * every scene starts exactly where the previous one's ends. The first scene
 * starts at 0 (it covers the line's own head silence too).
 */
export const SCENE_STARTS_BK = NARRATION_BK.lines.map((l, i) => (i === 0 ? 0 : l.frame));

export const SCENE_DUR_BK = SCENE_STARTS_BK.map((start, i) =>
	i + 1 < SCENE_STARTS_BK.length ? SCENE_STARTS_BK[i + 1] - start : TOTAL_FRAMES_BK - start,
);

/**
 * Frame of a spoken word in the LOCAL timeline of scene `scene` (0-indexed) —
 * scenes live inside their own Sequence, so every useCurrentFrame there is local.
 */
export const cueLocalBK = (scene: number, id: string, re: RegExp): number =>
	wordBK(id, re) - SCENE_STARTS_BK[scene];
