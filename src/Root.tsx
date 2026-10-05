import "./index.css";
import {Composition} from "remotion";
import {LifePhases, FPS, TOTAL_FRAMES} from "./LifePhases";
import {ComecePequeno, FPS_CP, TOTAL_FRAMES_CP} from "./ComecePequeno";
import {IFood, FPS_IF, TOTAL_FRAMES_IF} from "./IFood";
import {Netflix, FPS_NF, TOTAL_FRAMES_NF} from "./Netflix";
import {Disney, FPS_DF, TOTAL_FRAMES_DF} from "./Disney";
import {Anthropic, FPS_AT, TOTAL_FRAMES_AT} from "./Anthropic";
import {Microsoft, FPS_MS, TOTAL_FRAMES_MS} from "./Microsoft";
import {CocaCola, FPS_CC, TOTAL_FRAMES_CC} from "./CocaCola";
import {MaquinaIA, FPS_MQ, TOTAL_FRAMES_MQ} from "./MaquinaIA";
import {MaquinaDinheiro, FPS_MDD, TOTAL_FRAMES_MDD} from "./MaquinaDinheiro";
import {CaptionPreview, FPS_CPV, TOTAL_FRAMES_CPV} from "./CaptionPreview";
import {Google, FPS_GG, TOTAL_FRAMES_GG} from "./Google";
import {BurgerKing, FPS_BK, TOTAL_FRAMES_BK} from "./BurgerKing";
import {Recomecar, FPS_RC, TOTAL_FRAMES_RC} from "./Recomecar";
import {Continuidade, FPS_CT, TOTAL_FRAMES_CT} from "./Continuidade";
import {Biblioteca, FPS_BIB, TOTAL_FRAMES_BIB} from "./Biblioteca";
import {Piloto, FPS_PI, TOTAL_FRAMES_PI} from "./Piloto";
import {ConstanciaDourada, FPS_CDD, TOTAL_FRAMES_CDD} from "./ConstanciaDourada";
import {PostCx, FPS_FBGON, TOTAL_FRAMES_FBGON} from "./PostCx";
import {PostGwmm, FPS_LAGPF, TOTAL_FRAMES_LAGPF} from "./PostGwmm";
import {PostKouc, FPS_OCOOG, TOTAL_FRAMES_OCOOG} from "./PostKouc";
import {PostD, FPS_AGING, TOTAL_FRAMES_AGING} from "./PostD";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* npx remotion render LifePhases out/life-phases.mp4 */}
			<Composition
				id="LifePhases"
				component={LifePhases}
				durationInFrames={TOTAL_FRAMES}
				fps={FPS}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render ComecePequeno out/comece-pequeno.mp4 */}
			<Composition
				id="ComecePequeno"
				component={ComecePequeno}
				durationInFrames={TOTAL_FRAMES_CP}
				fps={FPS_CP}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render IFood out/ifood.mp4 */}
			<Composition
				id="IFood"
				component={IFood}
				durationInFrames={TOTAL_FRAMES_IF}
				fps={FPS_IF}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render Netflix out/netflix.mp4 */}
			<Composition
				id="Netflix"
				component={Netflix}
				durationInFrames={TOTAL_FRAMES_NF}
				fps={FPS_NF}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render Disney out/disney.mp4 */}
			<Composition
				id="Disney"
				component={Disney}
				durationInFrames={TOTAL_FRAMES_DF}
				fps={FPS_DF}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render Anthropic out/anthropic.mp4 */}
			<Composition
				id="Anthropic"
				component={Anthropic}
				durationInFrames={TOTAL_FRAMES_AT}
				fps={FPS_AT}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render Microsoft out/microsoft.mp4 */}
			<Composition
				id="Microsoft"
				component={Microsoft}
				durationInFrames={TOTAL_FRAMES_MS}
				fps={FPS_MS}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render CocaCola out/cocacola.mp4 */}
			<Composition
				id="CocaCola"
				component={CocaCola}
				durationInFrames={TOTAL_FRAMES_CC}
				fps={FPS_CC}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render MaquinaIA out/maquina-ia.mp4 */}
			<Composition
				id="MaquinaIA"
				component={MaquinaIA}
				durationInFrames={TOTAL_FRAMES_MQ}
				fps={FPS_MQ}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render MaquinaDinheiro out/maquina-dinheiro.mp4 */}
			<Composition
				id="MaquinaDinheiro"
				component={MaquinaDinheiro}
				durationInFrames={TOTAL_FRAMES_MDD}
				fps={FPS_MDD}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render CaptionPreview out.mp4 --props='{"style":"karaoke"}' */}
			<Composition
				id="CaptionPreview"
				component={CaptionPreview}
				durationInFrames={TOTAL_FRAMES_CPV}
				fps={FPS_CPV}
				width={1080}
				height={1920}
				defaultProps={{style: "karaoke" as const}}
			/>

			{/* npx remotion render Google out/google.mp4 */}
			<Composition
				id="Google"
				component={Google}
				durationInFrames={TOTAL_FRAMES_GG}
				fps={FPS_GG}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render BurgerKing out/burger-king.mp4 */}
			<Composition
				id="BurgerKing"
				component={BurgerKing}
				durationInFrames={TOTAL_FRAMES_BK}
				fps={FPS_BK}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render Recomecar out/recomecar.mp4 */}
			<Composition
				id="Recomecar"
				component={Recomecar}
				durationInFrames={TOTAL_FRAMES_RC}
				fps={FPS_RC}
				width={1080}
				height={1920}
			/>

			{/* npx remotion render Continuidade out/continuidade.mp4 */}
			<Composition
				id="Continuidade"
				component={Continuidade}
				durationInFrames={TOTAL_FRAMES_CT}
				fps={FPS_CT}
				width={1080}
				height={1920}
			/>

			{/* npx remotion still src/index.ts Biblioteca x.png --props='{"componente":"texto_cta"}' */}
			<Composition
				id="Biblioteca"
				component={Biblioteca}
				durationInFrames={TOTAL_FRAMES_BIB}
				fps={FPS_BIB}
				width={1080}
				height={1920}
				defaultProps={{componente: "texto_titulo", params: {texto: "1928"}}}
			/>

			{/* spec: src/specs/pi.json */}
			<Composition
				id="Piloto"
				component={Piloto}
				durationInFrames={TOTAL_FRAMES_PI}
				fps={FPS_PI}
				width={1080}
				height={1080}
			/>

			{/* spec: src/specs/cdd.json */}
			<Composition
				id="ConstanciaDourada"
				component={ConstanciaDourada}
				durationInFrames={TOTAL_FRAMES_CDD}
				fps={FPS_CDD}
				width={1080}
				height={1350}
			/>

			{/* spec: src/specs/fbgon.json */}
			<Composition
				id="PostCx"
				component={PostCx}
				durationInFrames={TOTAL_FRAMES_FBGON}
				fps={FPS_FBGON}
				width={1080}
				height={1080}
			/>

			{/* spec: src/specs/lagpf.json */}
			<Composition
				id="PostGwmm"
				component={PostGwmm}
				durationInFrames={TOTAL_FRAMES_LAGPF}
				fps={FPS_LAGPF}
				width={1080}
				height={1080}
			/>

			{/* spec: src/specs/ocoog.json */}
			<Composition
				id="PostKouc"
				component={PostKouc}
				durationInFrames={TOTAL_FRAMES_OCOOG}
				fps={FPS_OCOOG}
				width={1080}
				height={1350}
			/>

			{/* spec: src/specs/aging.json */}
			<Composition
				id="PostD"
				component={PostD}
				durationInFrames={TOTAL_FRAMES_AGING}
				fps={FPS_AGING}
				width={1080}
				height={1350}
			/>
		</>
	);
};
