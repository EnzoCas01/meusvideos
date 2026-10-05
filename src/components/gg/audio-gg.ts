/**
 * Audio configuration for the Google film (sx=gg).
 *
 * No music bed — the film is silent except for sound effects.
 * Every cue below exists because something specific happens on screen, and every
 * cue is listed in the order the story plays out. Scene 1 (the opening) is
 * deliberately silent — Enzo's explicit request.
 */

export const AUDIO_GG = {
	sfx: {
		enabled: true,
		cues: [
			// Scene 4→5 transition — the investment arrives (Scene5Invest.tsx:4, `at` 16% of line).
			{src: "audio/gg/investment-ping.wav", frame: 747, durationInFrames: 20, volume: 0.16},
			// Scene 8 — the market value number appears (Scene8Value.tsx:5, `value` at 33% of line).
			{src: "audio/gg/market-value-count.wav", frame: 1345, durationInFrames: 40, volume: 0.15},
			// Scene 9 — the "COMENTA EU QUERO" text appears (Scene9CTA.tsx:8, `cta` at 15% of line).
			{src: "audio/gg/cta-pop.wav", frame: 1452, durationInFrames: 25, volume: 0.18},
		],
	},
} as const;
