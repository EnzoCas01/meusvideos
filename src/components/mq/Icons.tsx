import React from "react";

export type RoleKind = "diretor" | "motion" | "revisor" | "narracao" | "som" | "imagem" | "render";

/** Line icons drawn so each one MEANS its role: claquete, curva de animação, lupa, microfone, onda, câmera, engrenagem. */
const ICONS_MQ: Record<RoleKind, React.ReactElement> = {
	diretor: (
		<g>
			<rect x="8" y="24" width="32" height="14" rx="2" />
			<path d="M8 24 L40 24 L34 10 L10 18 Z" />
			<path d="M18 12 L14 24 M26 11 L22 24" />
		</g>
	),
	motion: (
		<g>
			<path d="M6 40 C22 40 14 10 40 10" />
			<path d="M32 6 L40 10 L33 16" />
			<circle cx="6" cy="40" r="3" />
			<circle cx="40" cy="10" r="3" />
		</g>
	),
	revisor: (
		<g>
			<circle cx="21" cy="21" r="12" />
			<path d="M30 30 L40 40" />
			<path d="M16 21 L20 25 L27 16" />
		</g>
	),
	narracao: (
		<g>
			<rect x="19" y="7" width="10" height="20" rx="5" />
			<path d="M12 22 C12 30 16 34 24 34 C32 34 36 30 36 22" />
			<path d="M24 34 L24 41 M17 41 L31 41" />
		</g>
	),
	som: (
		<g>
			<path d="M8 24 L8 24 M14 17 L14 31 M21 10 L21 38 M28 15 L28 33 M35 20 L35 28 M42 23 L42 25" />
		</g>
	),
	imagem: (
		<g>
			<rect x="6" y="15" width="27" height="19" rx="3" />
			<path d="M33 21 L42 16 L42 33 L33 28" />
			<circle cx="19" cy="24.5" r="5" />
		</g>
	),
	render: (
		<g>
			<circle cx="24" cy="24" r="8" />
			<path d="M24 6 L24 12 M24 36 L24 42 M6 24 L12 24 M36 24 L42 24 M11 11 L16 16 M32 32 L37 37 M37 11 L32 16 M16 32 L11 37" />
		</g>
	),
};

export const RoleIcon: React.FC<{kind: RoleKind; size: number; color: string; width?: number}> = ({
	kind,
	size,
	color,
	width = 3.2,
}) => {
	const Drawn = ICONS_MQ[kind];
	return (
		<svg width={size} height={size} viewBox="0 0 48 48" fill="none">
			<g stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none">
				{Drawn}
			</g>
		</svg>
	);
};
