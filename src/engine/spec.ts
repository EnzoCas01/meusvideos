import {z} from "zod";

export const midiaSchema = z.object({
	arquivo: z.string().min(1),
	movimento: z.enum(["zoom-in", "zoom-out", "pan-l", "pan-r", "nenhum"]).optional(),
});

export const componenteSchema = z.object({
	componente: z.string().min(1),
	params: z.record(z.string(), z.unknown()).optional(),
});

export const cenaSchema = z.object({
	n: z.number().int().positive(),
	from: z.number().int().optional(),
	durationInFrames: z.number().int().positive().optional(),
	tema: z.string().optional(),
	midia: midiaSchema.optional(),
	layout: componenteSchema.optional(),
	texto: componenteSchema.optional(),
	cta: componenteSchema.optional(),
	transicao: z.string().optional(),
	som: z.string().optional(),
	fundo: z.string().optional(),
	custom: z.string().optional(),
});

export const legendaSchema = z.object({
	componente: z.string().min(1),
	posicao: z.enum(["meio", "baixo", "alto"]).optional(),
});

export const specSchema = z.object({
	formato: z.enum(["video", "post", "carrossel"]),
	peca: z.string().regex(/^[A-Z][A-Za-z0-9]{2,40}$/),
	sx: z.string().regex(/^[a-z]{2,5}$/),
	dims: z.tuple([z.number().int().positive(), z.number().int().positive()]),
	fps: z.number().int().positive().default(30),
	tema: z.string().min(1),
	logo: z.boolean().optional(),
	narracao: z.string().optional(),
	legenda: legendaSchema.optional(),
	cenas: z.array(cenaSchema).min(1),
});

export type Spec = z.infer<typeof specSchema>;
export type CenaSpec = z.infer<typeof cenaSchema>;
export type MidiaSpec = z.infer<typeof midiaSchema>;

/** Parses and validates a raw spec (e.g. imported JSON), with a readable error. */
export const validaSpec = (dado: unknown): Spec => {
	const r = specSchema.safeParse(dado);
	if (!r.success) {
		const linhas = r.error.issues
			.map((i) => `  - ${i.path.join(".") || "spec"}: ${i.message}`)
			.join("\n");
		throw new Error(`spec inválida:\n${linhas}`);
	}
	return r.data;
};
