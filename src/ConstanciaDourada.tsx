import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/cdd.json";


const spec = validaSpec(specBruto);

export const ConstanciaDourada: React.FC = () => <Motor spec={spec} />;

export const FPS_CDD = spec.fps;
export const TOTAL_FRAMES_CDD = totalFrames(spec);
