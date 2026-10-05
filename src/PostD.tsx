import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/aging.json";


const spec = validaSpec(specBruto);

export const PostD: React.FC = () => <Motor spec={spec} />;

export const FPS_AGING = spec.fps;
export const TOTAL_FRAMES_AGING = totalFrames(spec);
