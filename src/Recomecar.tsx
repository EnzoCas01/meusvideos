import React from "react";
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	interpolate,
	OffthreadVideo,
	Sequence,
	staticFile,
	useCurrentFrame,
} from "remotion";
import {CaptionsStyled} from "./components/captions/CaptionsStyled";
import n from "./narration-rc.json";

export const FPS_RC = 30;
/** Voz termina em 322 (+12 de cauda); o plano pede 30s — a cauda contemplativa
 * (caminhada → amanhecer clareando → horizonte) respira até 900, sempre com mídia na tela. */
export const TOTAL_FRAMES_RC = 900;

const GOLD = "#E0B15C";
const CREAM = "#F2EFE9";
const SANS = "Inter, system-ui, sans-serif";

/** Dissolve cruzado: cada cena entra por cima da anterior — nunca corte seco. */
const OVERLAP = 10;

type Line = {
	id: string;
	frame: number;
	durationInFrames: number;
	words: {w: string; s: number; e: number}[];
};
const LINES = n.lines as Line[];

const Dissolve: React.FC<{fadeIn?: number; children: React.ReactNode}> = ({fadeIn = OVERLAP, children}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, fadeIn], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

type KenBurnsProps = {
	src: string;
	startFrom: number;
	dur: number;
	scale?: [number, number];
	panY?: [number, number];
	brightness?: [number, number];
};
/** Clipe/foto em tela cheia com zoom/pan lento — sempre nítido. */
const KenBurns: React.FC<KenBurnsProps> = ({
	src,
	startFrom,
	dur,
	scale = [1.04, 1.12],
	panY = [0, 0],
	brightness = [1, 1],
}) => {
	const frame = useCurrentFrame();
	const s = interpolate(frame, [0, dur], scale, {extrapolateRight: "clamp"});
	const y = interpolate(frame, [0, dur], panY, {extrapolateRight: "clamp"});
	const b = interpolate(frame, [0, dur], brightness, {extrapolateRight: "clamp"});
	return (
		<AbsoluteFill style={{backgroundColor: "#000"}}>
			<AbsoluteFill style={{transform: `scale(${s}) translateY(${y}px)`, filter: `brightness(${b})`}}>
				{src.endsWith(".mp4") ? (
					<OffthreadVideo
						src={staticFile(src)}
						muted
						startFrom={startFrom}
						style={{width: "100%", height: "100%", objectFit: "cover"}}
					/>
				) : (
					<Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
				)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

type WordPart = {t: string; gold?: boolean};
/** Texto de impacto: 1-3 palavras grandes no terço superior, entrando na palavra da fala. */
const Impact: React.FC<{start: number; top: number; size: number; rows: WordPart[][]; end?: number}> = ({
	start,
	top,
	size,
	rows,
	end,
}) => {
	const frame = useCurrentFrame();
	const inOp = interpolate(frame, [start, start + 14], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const inY = interpolate(frame, [start, start + 16], [26, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const blur = interpolate(frame, [start, start + 14], [14, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const outOp = end === undefined ? 1 : interpolate(frame, [end, end + 8], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					top,
					left: 70,
					width: 940,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 8,
					fontFamily: SANS,
					fontWeight: 700,
					fontSize: size,
					lineHeight: 1.08,
					letterSpacing: "0.05em",
					textTransform: "uppercase",
					textAlign: "center",
					color: CREAM,
					opacity: Math.min(inOp, outOp),
					transform: `translateY(${inY}px)`,
					filter: `blur(${blur}px)`,
					textShadow: "0 6px 30px rgba(0,0,0,0.55)",
				}}
			>
				{rows.map((row, i) => (
					<div key={i} style={{display: "flex", gap: 22}}>
						{row.map((w, j) => (
							<span key={j} style={{color: w.gold ? GOLD : CREAM}}>
								{w.t}
							</span>
						))}
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

/** Marca d'água discreta no rodapé, só durante a cena 3. */
const Watermark: React.FC<{start: number; end: number}> = ({start, end}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [start, start + 12, end - 12, end], [0, 0.38, 0.38, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	return (
		<div
			style={{
				position: "absolute",
				bottom: 64,
				left: 70,
				fontFamily: SANS,
				fontWeight: 500,
				fontSize: 36,
				letterSpacing: "0.02em",
				color: CREAM,
				opacity,
			}}
		>
			Você sabia?
		</div>
	);
};

const C6Body: React.FC = () => {
	const frame = useCurrentFrame();
	// frase pequena e centralizada depois que a voz já foi (global 780-850)
	const frase = interpolate(frame, [200, 208, 262, 270], [0, 1, 1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const black = interpolate(frame, [290, 310], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.in(Easing.cubic),
	});
	return (
		<>
			<div
				style={{
					position: "absolute",
					top: 900,
					left: 70,
					width: 940,
					textAlign: "center",
					fontFamily: SANS,
					fontWeight: 500,
					fontSize: 54,
					letterSpacing: "0.02em",
					color: CREAM,
					opacity: frase,
				}}
			>
				Dá o próximo passo
			</div>
			<AbsoluteFill style={{backgroundColor: "#000", opacity: black}} />
		</>
	);
};

export const Recomecar: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: "#000", overflow: "hidden"}}>
			{/* cena 1 (0-90): a queda, tela cheia, zoom lento — abertura sem texto */}
			<Sequence durationInFrames={90 + OVERLAP}>
				<Dissolve>
					<KenBurns
						src="videos/recomecar/clip-38.mp4"
						startFrom={30}
						dur={90}
						scale={[1.02, 1.12]}
						panY={[6, -6]}
					/>
				</Dissolve>
			</Sequence>

			{/* cena 2 (78-145): mãos se apoiando no chão */}
			<Sequence from={78} durationInFrames={57 + OVERLAP}>
				<Dissolve>
					<KenBurns src="videos/recomecar/clip-03.mp4" startFrom={15} dur={57} scale={[1.06, 1.14]} />
					{/* 'Ninguém mostra' entra na palavra 'mostra' (frame 84 global) */}
					<Impact
						start={84 - 78}
						top={360}
						size={104}
						rows={[[{t: "Ninguém", gold: true}], [{t: "Mostra"}]]}
					/>
				</Dissolve>
			</Sequence>

			{/* cena 3 (111-330): botas pisando firme e caminhada no deserto (clip-43 novo da revisão) */}
			<Sequence from={111} durationInFrames={219}>
				<Dissolve>
					<KenBurns
						src="videos/recomecar/clip-43.mp4"
						startFrom={0}
						dur={219}
						scale={[1.03, 1.09]}
					/>
					{/* 'Levantar mais uma vez' na palavra 'levantar' (frame 226 global) */}
					<Impact
						start={226 - 111}
						top={420}
						size={88}
						rows={[[{t: "Levantar", gold: true}], [{t: "Mais"}, {t: "uma"}, {t: "vez"}]]}
						end={281 - 111}
					/>
					<Watermark start={151 - 111} end={271 - 111} />
				</Dissolve>
			</Sequence>

			{/* cena 5 (277-470): silhueta caminhando em direção à luz */}
			<Sequence from={277} durationInFrames={183 + OVERLAP}>
				<Dissolve>
					<KenBurns
						src="videos/recomecar/clip-14.mp4"
						startFrom={90}
						dur={183}
						scale={[1.03, 1.12]}
						panY={[0, -10]}
					/>
					{/* 'Recomeçar é vencer' na palavra 'vencer' (frame 305 global) */}
					<Impact
						start={305 - 277}
						top={420}
						size={88}
						rows={[[{t: "Recomeçar", gold: true}], [{t: "É"}, {t: "vencer"}]]}
						end={442 - 277}
					/>
				</Dissolve>
			</Sequence>

			{/* cena 4 (440-600): nascer do sol clareando — respiro contemplativo, sem texto */}
			<Sequence from={440} durationInFrames={160}>
				<Dissolve fadeIn={20}>
					<KenBurns
						src="images/recomecar/12.jpg"
						startFrom={0}
						dur={160}
						scale={[1.0, 1.09]}
						brightness={[0.72, 1.12]}
					/>
				</Dissolve>
			</Sequence>

			{/* cena 6 (580-900): horizonte amplo ao amanhecer, frase pequena, fade */}
			<Sequence from={580} durationInFrames={320}>
				<Dissolve>
					<KenBurns
						src="images/recomecar/13.jpg"
						startFrom={0}
						dur={320}
						scale={[1.06, 1.16]}
						panY={[10, -10]}
					/>
					{/* 'Próximo passo' no início do fecho (global 610-700) */}
					<Impact
						start={30}
						top={460}
						size={96}
						rows={[[{t: "Próximo"}, {t: "Passo", gold: true}]]}
						end={120}
					/>
					<C6Body />
				</Dissolve>
			</Sequence>

			{/* voz — frames exatos de narration-rc.json */}
			{LINES.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`audio/vo-rc/${l.id}.wav`)} />
				</Sequence>
			))}
			{/* legenda karaokê, uma vez, por cima de todas as cenas */}
			<CaptionsStyled
				style="karaoke"
				posicao="baixo"
				lines={LINES.map((l) => ({frame: l.frame, words: l.words}))}
				accent={GOLD}
				onAccent="#161208"
				text={CREAM}
				fontFamily={SANS}
			/>
		</AbsoluteFill>
	);
};
