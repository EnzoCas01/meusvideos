import {LAST_WORD_CC, NARRATION_CC, lineCC as line} from "./narration-cc";
export const FPS_CC = 30;

/** First spoken line of each scene, in film order. */
const SCENE_LINES_CC = [
	"01-gancho", // 1. Você sabia? — o contraste 9 por dia x 2,1+ bilhões
	"04-1886", // 2. o começo: Pemberton, Atlanta, 8 de maio de 1886
	"05-novidade", // 3. a bebida precisava ser conhecida: anúncio e cupons
	"08-candler", // 4. a escala começa: Asa Candler e a The Coca-Cola Company
	"10-identidade", // 5. identidade: logotipo e a garrafa de 1915
	"12-nove", // 6. o contraste final
	"14-fecho", // 7. fechamento
] as const;

/** Scenes change during the pause before their first line, not on the word. */
const LEAD_CC = 6;

/** Frames a scene stays mounted past the start of the next one, for the dissolve. */
export const OVERLAP_CC = 10;

/** Scene i starts just before its first line (scene 1 opens on frame 0). Derived from the narration JSON. */
export const SCENE_STARTS_CC: number[] = SCENE_LINES_CC.map((id, i) => (i === 0 ? 0 : line(id).frame - LEAD_CC));

/** Absolute frame the film ends on: last word plus the JSON tail. */
export const END_CC = LAST_WORD_CC + NARRATION_CC.tailFrames;

/** How long scene `i` stays mounted, overlap included. */
export const sceneDurationCC = (i: number): number => {
	const next = i + 1 < SCENE_STARTS_CC.length ? SCENE_STARTS_CC[i + 1] + OVERLAP_CC : END_CC;
	return next - SCENE_STARTS_CC[i];
};
