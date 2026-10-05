import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/ocoog.json";


const spec = validaSpec(specBruto);

export const PostKouc: React.FC = () => <Motor spec={spec} />;

export const FPS_OCOOG = spec.fps;
export const TOTAL_FRAMES_OCOOG = totalFrames(spec);
