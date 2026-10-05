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
import n from "./narration-ct.json";

export const FPS_CT = 30;
/** Cenas do plano (9+10+11 s = 900 frames). Falas reposicionadas dentro da janela de cada cena:
 *  L1 em 6, L2 em 288, L3 em 588 (frames em narration-ct.json). Voz termina em 698. */
export const TOTAL_FRAMES_CT = 900;

const GOLD = "#E0B15C";
const CREAM = "#F2EFE9";
const SANS = "Inter, system-ui, sans-serif";

/** Dissolve cruzado: cada cena entra por cima da anterior — nunca corte seco.
 *  Janelas das cenas: 0-270, 270-570, 570-900. Cada Sequence começa 12 antes e
 *  termina 12 depois da janela, e o dissolve acontece no encontro das duas. */
const OVERLAP = 12;

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
	startFrom?: number;
	dur: number;
	scale?: [number, number];
	panY?: [number, number];
	panX?: [number, number];
	/** Rack focus de entrada: blur cai a zero nos primeiros `focus` frames. */
	focus?: number;
	brightness?: [number, number];
	/** Clipe mais curto que a cena: desacelera em vez de congelar. */
	rate?: number;
	/** Foto estática (Ken Burns sobre imagem) em vez de clipe. */
	photo?: boolean;
};
/** Clipe ou foto em tela cheia com zoom/pan lento — sempre nítido depois do foco puxar. */
const KenBurns: React.FC<KenBurnsProps> = ({
	src,
	startFrom,
	dur,
	scale = [1.04, 1.12],
	panY = [0, 0],
	panX = [0, 0],
	focus = 0,
	brightness = [1, 1],
	rate = 1,
	photo = false,
}) => {
	const frame = useCurrentFrame();
	const s = interpolate(frame, [0, dur], scale, {extrapolateRight: "clamp"});
	const y = interpolate(frame, [0, dur], panY, {extrapolateRight: "clamp"});
	const x = interpolate(frame, [0, dur], panX, {extrapolateRight: "clamp"});
	const b = interpolate(frame, [0, dur], brightness, {extrapolateRight: "clamp"});
	const blur = focus ? interpolate(frame, [0, focus], [16, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
	const filters = [`brightness(${b})`];
	if (blur) filters.push(`blur(${blur}px)`);
	return (
		<AbsoluteFill style={{backgroundColor: "#000"}}>
			<AbsoluteFill style={{transform: `scale(${s}) translate(${x}px, ${y}px)`, filter: filters.join(" ")}}>
				{photo ? (
					<Img src={staticFile(src)} style={{width: "100%", height: "100%", objectFit: "cover"}} />
				) : (
					<OffthreadVideo
						src={staticFile(src)}
						muted
						startFrom={startFrom}
						playbackRate={rate}
						style={{width: "100%", height: "100%", objectFit: "cover"}}
					/>
				)}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Texto de impacto: 1-3 palavras grandes, entrando na palavra exata da fala. */
const Impact: React.FC<{start: number; end: number; top: number; size: number; gold: string[]; words: string[]}> = ({
	start,
	end,
	top,
	size,
	gold,
	words,
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
	const blur = interpolate(frame, [start, start + 14], [12, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	const outOp = interpolate(frame, [end, end + 10], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
	return (
		<AbsoluteFill style={{pointerEvents: "none"}}>
			<div
				style={{
					position: "absolute",
					top,
					left: 70,
					width: 940,
					display: "flex",
					justifyContent: "center",
					gap: 26,
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
				{words.map((w, i) => (
					<span key={i} style={{color: gold.includes(w) ? GOLD : CREAM}}>
						{w}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};

export const Continuidade: React.FC = () => {
	return (
		<AbsoluteFill style={{backgroundColor: "#000", overflow: "hidden"}}>
			{/* cena 1 (0-270): janela com chuva, foco puxando de desfocado a nítido na entrada.
			    clipe de 19,5 s a 0,5x cobre a cena com folga — a chuva lenta reforça o "tudo parado" */}
			<Sequence durationInFrames={270 + OVERLAP}>
				<Dissolve>
					<KenBurns
						src="videos/ct/clip-03.mp4"
						startFrom={5}
						dur={270 + OVERLAP}
						rate={0.5}
						scale={[1.02, 1.1]}
						panY={[8, -6]}
						focus={30}
					/>
					{/* "TUDO PARADO" entra na palavra 'parado' (6+38 = frame 44) e atravessa o silêncio
					    até 244 — some antes do corte (270), nunca tela vazia só com legenda */}
					<Impact start={44} end={244} top={380} size={104} gold={["Parado"]} words={["Tudo", "Parado"]} />
				</Dissolve>
			</Sequence>

			{/* cena 2 (270-570): caminhada na praia ao entardecer, luz quente crescendo */}
			<Sequence from={270 - OVERLAP} durationInFrames={300 + 2 * OVERLAP}>
				<Dissolve>
					<KenBurns
						src="videos/ct-v6/clip-02.mp4"
						startFrom={30}
						dur={300 + 2 * OVERLAP}
						scale={[1.06, 1.14]}
						panY={[4, -8]}
						brightness={[0.86, 1.08]}
					/>
					{/* "A LUZ VOLTA" entra na palavra 'luz' (288+68 = frame 356) e fica no silêncio até 540 */}
					<Impact start={356 - (270 - OVERLAP)} end={540 - (270 - OVERLAP)} top={380} size={104} gold={["Luz"]} words={["A", "Luz", "Volta"]} />
				</Dissolve>
			</Sequence>

			{/* cena 3 (570-900): silhueta rumo ao horizonte dourado — foto com zoom-out lento e luz
			    subindo; sustenta até o fim, sem fade preto e sem texto final */}
			<Sequence from={570 - OVERLAP} durationInFrames={TOTAL_FRAMES_CT - (570 - OVERLAP)}>
				<Dissolve>
					<KenBurns
						photo
						src="images/pex-ct-praia/10.jpg"
						dur={TOTAL_FRAMES_CT - (570 - OVERLAP)}
						scale={[1.34, 1.32]}
						panX={[123, 123]}
						panY={[10, -6]}
						brightness={[0.94, 1.1]}
					/>
					{/* "MAIS FORTE" entra na palavra 'forte' (588+81 = frame 669) e some antes do fecho */}
					<Impact start={669 - (570 - OVERLAP)} end={808 - (570 - OVERLAP)} top={400} size={104} gold={["Forte"]} words={["Mais", "Forte"]} />
				</Dissolve>
			</Sequence>

			{/* voz — frames exatos de narration-ct.json */}
			{LINES.map((l) => (
				<Sequence key={l.id} from={l.frame} durationInFrames={l.durationInFrames} layout="none">
					<Audio src={staticFile(`audio/vo-ct/${l.id}.wav`)} />
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
