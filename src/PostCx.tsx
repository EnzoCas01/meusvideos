import React from "react";
import {Motor, totalFrames} from "./engine/Motor";
import {validaSpec} from "./engine/spec";
import specBruto from "./specs/fbgon.json";


const spec = validaSpec(specBruto);

export const PostCx: React.FC = () => <Motor spec={spec} />;

export const FPS_FBGON = spec.fps;
export const TOTAL_FRAMES_FBGON = totalFrames(spec);
