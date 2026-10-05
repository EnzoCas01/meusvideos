import {NARRATION_MQ, lineMQ, wordMQ} from "./narration-mq";

/** End of the film: last spoken clip plus the JSON tail — never hardcoded. */
const LAST_CLIP_MQ = NARRATION_MQ.lines.reduce(
	(acc, l) => Math.max(acc, l.frame + l.durationInFrames),
	0,
);
export const TOTAL_FRAMES_MQ = LAST_CLIP_MQ + NARRATION_MQ.tailFrames;

/** Where each scene starts, all derived from the narration JSON. */
export const SCENE_STARTS_MQ = [
	0, // gancho
	lineMQ("03-calma").frame, // revelação
	lineMQ("05-lista").frame, // lista dos 7
	lineMQ("06-ideia").frame, // sistema / linha de montagem
	lineMQ("08-esse").frame, // vídeo pronto
	lineMQ("09-escala").frame, // escala
	lineMQ("11-quer").frame, // CTA
] as const;

export const SCENE_DUR_MQ = SCENE_STARTS_MQ.map((start, i) =>
	i + 1 < SCENE_STARTS_MQ.length ? SCENE_STARTS_MQ[i + 1] - start : TOTAL_FRAMES_MQ - start,
);

/**
 * Frame of a spoken word in the LOCAL timeline of scene `scene` — scenes live
 * inside their own Sequence, so every `useCurrentFrame` there is local.
 */
export const cueLocalMQ = (scene: number, id: string, re: RegExp): number =>
	wordMQ(id, re) - SCENE_STARTS_MQ[scene];
