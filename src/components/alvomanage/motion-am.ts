import {Easing, interpolate, spring} from "remotion";
import {FPS_AM_LOCAL} from "./constants-am";
import {EASE_AM} from "../../utils/theme-am";
import type {RectAM} from "../../utils/images-am";

const ease = Easing.bezier(...EASE_AM);

/** Keyframed value with expo-out between stops, clamped at both ends. */
export const kf = (frame: number, frames: number[], values: number[]): number => {
	// interpolate() needs strictly increasing input; nudge ties apart.
	const fixed: number[] = [];
	for (let i = 0; i < frames.length; i++) {
		fixed.push(i > 0 && frames[i] <= fixed[i - 1] ? fixed[i - 1] + 1 : frames[i]);
	}
	return interpolate(frame, fixed, values, {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: ease,
	});
};

/** 0 -> 1 over `dur` frames from `start`, expo-out. */
export const ramp = (frame: number, start: number, dur = 8): number =>
	kf(frame, [start, start + Math.max(1, dur)], [0, 1]);

/** Landing spring starting at `start` (0 before it). */
export const land = (frame: number, start: number, damping = 13): number =>
	frame < start ? 0 : spring({frame: frame - start, fps: FPS_AM_LOCAL, config: {damping, mass: 0.7}});

/** Rect keyframes (camera moves over a screenshot). */
export const kfRect = (frame: number, frames: number[], rects: RectAM[]): RectAM => ({
	x: kf(frame, frames, rects.map((q) => q.x)),
	y: kf(frame, frames, rects.map((q) => q.y)),
	w: kf(frame, frames, rects.map((q) => q.w)),
	h: kf(frame, frames, rects.map((q) => q.h)),
});

/** Grow a rect around its centre so it fits aspect `aspect` (w/h) and add padding. */
export const fitRect = (q: RectAM, aspect: number, pad = 1.15): RectAM => {
	let w = q.w * pad;
	let h = q.h * pad;
	if (w / h > aspect) h = w / aspect;
	else w = h * aspect;
	return {x: q.x + q.w / 2 - w / 2, y: q.y + q.h / 2 - h / 2, w, h};
};

/** Keep a camera rect inside the image (shrinks nothing, only slides). */
export const clampRect = (q: RectAM, imgW: number, imgH: number): RectAM => ({
	...q,
	x: Math.min(Math.max(q.x, 0), Math.max(0, imgW - q.w)),
	y: Math.min(Math.max(q.y, 0), Math.max(0, imgH - q.h)),
});

/** Deterministic small shake (vibration) — never Math.random. */
export const shake = (frame: number, amp: number, speed = 2.3): number =>
	Math.sin(frame * speed) * amp * Math.cos(frame * 0.71);
