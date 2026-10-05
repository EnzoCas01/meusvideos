import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/lagpf.json";


const spec = validaSpec(specBruto);

export const PostGwmm: React.FC = () => <Motor spec={spec} />;

export const FPS_LAGPF = spec.fps;
export const TOTAL_FRAMES_LAGPF = totalFrames(spec);
