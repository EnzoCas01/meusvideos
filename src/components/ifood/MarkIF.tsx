import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {fontFamily} from "../../utils/font";
import {IF} from "../../utils/theme-if";

type Props = {
	/** Local frame the mark resolves on. */
	start: number;
	opacity?: number;
};

/**
 * The closing mark.
 *
 * DELIBERATELY NOT THE COMPANY'S LOGO. This is a piece ABOUT a real public
 * company, not a piece FOR it, so no third-party trademark is reproduced or
 * approximated anywhere in the film — `images-if.ts` filters logo files out of
 * the manifest for the same reason.
 *
 * What sits here instead is the FILM's own mark: its title, set in the film's
 * own type, over the red accent the whole piece has been using for its impact
 * beats. It closes the last spoken line ("Essa foi a virada.") and carries no
 * motivational tag and no call to follow, exactly as the brief asks.
 */
export const MarkIF: React.FC<Props> = ({start, opacity = 1}) => {
	const frame = useCurrentFrame();
	const local = frame - start;
	if (local < 0) return null;

	const arrive = interpolate(local, [0, 26], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// The rule under the title draws a beat after the words settle.
	const rule = interpolate(local, [18, 48], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	// The accent dot lands last, and keeps a slow pulse so the final frames of
	// the film are not a freeze.
	const dot = interpolate(local, [34, 52], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const pulse = 1 + Math.sin(local / 17) * 0.06;

	const alpha = arrive * opacity;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				opacity: alpha,
			}}
		>
			{/* "A VIRADA" — 8 characters at 118px with spacing is about 600px wide,
			    comfortably inside 1080 with margins on both sides. */}
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 14,
					fontFamily,
					fontWeight: 600,
					fontSize: 118,
					letterSpacing: 10,
					lineHeight: 1,
					color: IF.white,
					filter: `blur(${(1 - arrive) * 14}px)`,
					transform: `translateY(${(1 - arrive) * 18}px)`,
				}}
			>
				<span>A VIRADA</span>
				<span
					style={{
						width: 18,
						height: 18,
						borderRadius: 9,
						background: IF.red,
						opacity: dot,
						transform: `scale(${dot * pulse})`,
						boxShadow: `0 0 40px rgba(234,29,44,${0.7 * dot})`,
						display: "inline-block",
					}}
				/>
			</div>

			<div
				style={{
					marginTop: 34,
					height: 3,
					width: 560 * rule,
					background: `linear-gradient(90deg, rgba(234,29,44,0) 0%, ${IF.red} 50%, rgba(234,29,44,0) 100%)`,
				}}
			/>

			<div
				style={{
					marginTop: 34,
					fontFamily,
					fontWeight: 400,
					fontSize: 30,
					letterSpacing: 7,
					color: IF.dim,
					opacity: rule,
				}}
			>
				UMA HISTÓRIA DE TECNOLOGIA
			</div>
		</div>
	);
};
