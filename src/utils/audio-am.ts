import {SIDEBAR_VIDEO} from "./images-am";
import {LINES_AM, NARRATION_AM, SCENE_DURATIONS_AM, SCENE_STARTS_AM, TOTAL_FRAMES_AM, cueAM} from "./timing-am";

export type SfxCueAM = {src: string; frame: number; durationInFrames: number; volume: number; name: string};

/**
 * Sound of "AlvoManage". Every file is synthesised by
 * `node tools/generate-audio-alvomanage.mjs` into public/audio/alvomanage/.
 *
 * RULE: a sound only where something happens on screen. Each cue below is
 * anchored on the SAME voice word the scene uses for that visual event
 * (cueAM(...).word(...)), so when the narration is re-measured, picture and
 * sound move together. If a scene changes its anchor word, change it here too.
 *
 * Scene 7 (am07, the joke) is near-silence: only the short buzz that never
 * completes, and the score dips under it (see `quietAM`).
 */
const DIR = "audio/alvomanage/";

const LEN: Record<string, number> = {
	"crack.wav": 21,
	"buzz.wav": 14,
	"buzz-short.wav": 5,
	"pop.wav": 8,
	"papers.wav": 33,
	"flip.wav": 9,
	"tick.wav": 4,
	"whoosh.wav": 18,
	"whoosh-up.wav": 27,
	"step-1.wav": 15,
	"step-2.wav": 15,
	"step-3.wav": 15,
	"pen.wav": 30,
	"stamp.wav": 14,
	"notif.wav": 36,
	"drawer.wav": 27,
	"coin.wav": 21,
	"rise.wav": 30,
	"chord.wav": 120,
};

const computeSfxCuesAM = (): SfxCueAM[] => {
	const cues: SfxCueAM[] = [];
	const at = (scene: number, local: number, file: string, volume: number, name: string) => {
		const frame = Math.round(SCENE_STARTS_AM[scene] + local);
		// Never let a cue spill outside its own scene's window (+ a short tail).
		if (local < 0 || local > SCENE_DURATIONS_AM[scene]) return;
		cues.push({src: DIR + file, frame, durationInFrames: LEN[file] ?? 30, volume, name});
	};

	/* sc1 — am01 */
	{
		const c = cueAM(0, "am01");
		const tDays = c.word("dois dias");
		const tCall = c.word("liga");
		at(0, c.word("trincada"), "crack.wav", 0.75, "vidro trinca");
		// calendar pages torn — same step as Scene01Hook's Calendar
		const step = Math.max(8, (tCall - 4 - tDays) / 2.4);
		at(0, tDays + 2, "flip.wav", 0.5, "folha 1");
		at(0, tDays + 2 + step, "flip.wav", 0.5, "folha 2");
		// phone buzzes in 24-frame cycles while it rings on screen
		for (let k = tCall; k < SCENE_DURATIONS_AM[0] - 10; k += 24) at(0, k, "buzz.wav", 0.55, "vibra");
		at(0, c.word("E aí"), "pop.wav", 0.5, "balão");
	}

	/* sc2 — am02 */
	{
		const c = cueAM(1, "am02");
		at(1, c.word("procura"), "papers.wav", 0.6, "papéis voam");
		at(1, c.word("pergunta") + 3, "pop.wav", 0.45, "balão ?");
	}

	/* sc3 — am03 */
	{
		const c = cueAM(2, "am03");
		at(2, 2, "papers.wav", 0.3, "papéis se alinham");
		// Same tCopy as Scene03OsLink (click on Copiar, not before the pan).
		const tUrl = Math.min(c.word("link"), c.word("E toda") + 8);
		at(2, Math.max(c.word("só dela"), tUrl + 24), "tick.wav", 0.7, "Copiar");
	}

	/* sc4 — am04 */
	{
		const c = cueAM(3, "am04");
		at(3, c.word("manda"), "whoosh.wav", 0.5, "link voa");
		at(3, c.word("cliente"), "step-1.wav", 0.4, "celular acende");
		at(3, c.word("aplicativo"), "whoosh.wav", 0.25, "risca app");
		at(3, c.word("sem senha") + 2, "whoosh.wav", 0.25, "risca senha");
	}

	/* sc5 — am05 */
	{
		const c = cueAM(4, "am05");
		at(4, c.word("aberto"), "step-1.wav", 0.45, "etapa aberto");
		at(4, c.word("pronto"), "step-2.wav", 0.45, "etapa pronto");
		at(4, c.word("entregue"), "step-3.wav", 0.45, "etapa entregue");
		at(4, c.word("assina"), "pen.wav", 0.5, "assinatura");
		at(4, c.word("ali mesmo"), "tick.wav", 0.5, "Confirmar");
	}

	/* sc6 — am06 */
	{
		const c = cueAM(5, "am06");
		at(5, c.word("plano"), "pop.wav", 0.45, "selo plano");
		at(5, c.word("pronta") + 4, "stamp.wav", 0.7, "carimbo Pronta");
		at(5, c.word("o aviso") + 2, "whoosh.wav", 0.35, "balão sai");
		at(5, c.word("celular"), "notif.wav", 0.55, "notificação pousa");
	}

	/* sc7 — am07: near-silence, one buzz that never completes */
	{
		const c = cueAM(6, "am07");
		at(6, c.word("toca"), "buzz-short.wav", 0.35, "trrr curto");
	}

	/* sc8 — am08 */
	{
		const c = cueAM(7, "am08");
		at(7, c.word("não é só"), "whoosh-up.wav", 0.3, "loja cresce");
		const tSist = c.word("É o sistema");
		const span = Math.max(12, SCENE_DURATIONS_AM[7] - tSist - 6);
		// Ticks only mark the highlight rings of the screenshot fallback; the
		// recorded menu has no discrete events to tick on.
		if (!SIDEBAR_VIDEO) {
			for (let k = 0; k < 4; k++) at(7, tSist + 4 + k * Math.round(span / 5), "tick.wav", 0.3, `menu ${k + 1}`);
		}
	}

	/* sc9 — am09 */
	{
		const c = cueAM(8, "am09");
		at(8, c.word("andamento"), "tick.wav", 0.5, "Em Andamento");
		at(8, c.word("parada"), "step-1.wav", 0.4, "alerta parada");
	}

	/* sc10 — am10 */
	{
		const c = cueAM(9, "am10");
		at(9, c.word("balcão"), "tick.wav", 0.6, "PDV +");
		at(9, c.word("preço"), "step-1.wav", 0.25, "preço");
		at(9, c.word("custo"), "step-1.wav", 0.25, "custo");
		at(9, c.word("lucro"), "step-2.wav", 0.25, "lucro");
		at(9, c.word("estoque"), "step-3.wav", 0.25, "estoque");
	}

	/* sc11 — am11 */
	{
		const c = cueAM(10, "am11");
		at(10, c.word("caixa"), "drawer.wav", 0.6, "gaveta abre");
		at(10, c.word("pagar") - 2, "whoosh.wav", 0.3, "a pagar sai");
		at(10, c.word("receber") + 6, "coin.wav", 0.45, "a receber entra");
		at(10, c.word("fluxo"), "rise.wav", 0.4, "gráfico sobe");
	}

	/* sc12 — am12 */
	{
		const c = cueAM(11, "am12");
		const tMais = c.word("mais de uma");
		for (let i = 0; i < 3; i++) at(11, tMais + i * 4, "pop.wav", 0.35, `loja ${i + 1}`);
		at(11, c.word("mesmo lugar") - 6, "rise.wav", 0.35, "linhas ao painel");
	}

	/* sc13 — am13 */
	{
		const c = cueAM(12, "am13");
		at(12, Math.max(4, c.word("AlvoManage") - 2), "chord.wav", 0.6, "acorde logo");
	}

	/*
	 * Breaths between lines (~0.4 s): rule "nunca sem SOM". Every cut lands in
	 * the breath, so each scene change gets a soft transition sound on the cut
	 * itself — skipped when a scene already has its own cue that close, so two
	 * sounds never pile up. Scene 7 (the joke) gets a tick, not a whoosh.
	 */
	for (let s = 1; s < SCENE_STARTS_AM.length; s++) {
		const f = SCENE_STARTS_AM[s] - 2;
		if (cues.some((q) => Math.abs(q.frame - f) <= 6)) continue;
		const file = s === 6 ? "tick.wav" : "whoosh.wav";
		cues.push({src: DIR + file, frame: f, durationInFrames: LEN[file] ?? 30, volume: s === 6 ? 0.25 : 0.2, name: `respiro ${s}`});
	}

	return cues;
};

/** Score multiplier for the whole of scene 7 (the joke lives in near-silence). */
export const quietAM = (frame: number): number => {
	const s = SCENE_STARTS_AM[6];
	const e = s + SCENE_DURATIONS_AM[6];
	const F = 10;
	if (frame <= s - F || frame >= e + F) return 1;
	const depth = Math.min(1, (frame - (s - F)) / F, (e + F - frame) / F);
	// Dips, never drops out: the score must keep sounding under the joke.
	return 1 - 0.65 * depth;
};

/** Multiplier for the bed under the voice. */
export const musicDuckAM = (frame: number): number => {
	if (!NARRATION_AM.enabled) return 1;
	const FADE = 8;
	let lowest = 1;
	for (const l of LINES_AM) {
		const start = l.frame - FADE;
		const end = l.frame + l.durationInFrames + FADE;
		if (frame < start || frame > end) continue;
		const depth = Math.min(1, (frame - start) / FADE, (end - frame) / FADE);
		lowest = Math.min(lowest, 1 - (1 - NARRATION_AM.duckMusicTo) * depth);
	}
	return lowest;
};

export const AUDIO_AM = {
	music: {
		enabled: true,
		src: "audio/alvomanage/score.wav",
		fadeInFrames: 12,
		fadeOutStart: TOTAL_FRAMES_AM - 60,
		totalFrames: TOTAL_FRAMES_AM,
		peakVolume: 0.32,
	},
	sfx: {
		enabled: true,
		get cues(): SfxCueAM[] {
			return computeSfxCuesAM();
		},
	},
};
