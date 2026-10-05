import {NARRATION_MDD, lineMDD, wordMDD} from "./narration-mdd";

/** End of the film: last spoken clip plus the JSON tail — never hardcoded. */
const LAST_CLIP_MDD = NARRATION_MDD.lines.reduce(
	(acc, l) => Math.max(acc, l.frame + l.durationInFrames),
	0,
);
export const TOTAL_FRAMES_MDD = LAST_CLIP_MDD + NARRATION_MDD.tailFrames;

/** Where each scene starts, all derived from the narration JSON. */
export const SCENE_STARTS_MDD = [
	0, // máquina (gancho + "Eu montei uma.")
	lineMDD("03-caltime").frame, // revelação: a máquina vira rede
	lineMDD("04-ideia").frame, // os agentes, um a um
	lineMDD("06-prova").frame, // o próprio estúdio
	lineMDD("07-escala").frame, // escala e monetização
	lineMDD("08-quer").frame, // EU QUERO + 100 mil likes
	lineMDD("09-cta").frame, // fechamento
] as const;

export const SCENE_DUR_MDD = SCENE_STARTS_MDD.map((start, i) =>
	i + 1 < SCENE_STARTS_MDD.length ? SCENE_STARTS_MDD[i + 1] - start : TOTAL_FRAMES_MDD - start,
);

/**
 * Frame of a spoken word in the LOCAL timeline of scene `scene` — scenes live
 * inside their own Sequence, so every `useCurrentFrame` there is local.
 */
export const cueLocalMDD = (scene: number, id: string, re: RegExp): number =>
	wordMDD(id, re) - SCENE_STARTS_MDD[scene];
