import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/pi.json";


const spec = validaSpec(specBruto);

export const Piloto: React.FC = () => <Motor spec={spec} />;

export const FPS_PI = spec.fps;
export const TOTAL_FRAMES_PI = totalFrames(spec);
