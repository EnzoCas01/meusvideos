// Monta public/audio/musica-candidatas/manifest.json a partir de medicoes.json + tabela das candidatas.
// uso: node tools/manifest-trilha.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "public/audio/musica-candidatas";
const medicoes = JSON.parse(readFileSync(join(SRC, "medicoes.json"), "utf8"));

const LICENCA = "CC BY 4.0";
const BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/";
const credito = (t) =>
  `"${t}" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/`;

// genero/feel/instrumentos: Incompetech Pieces 2020.csv (metadados oficiais do site, via archive.org)
const TABELA = [
  {
    grupo: "A", titulo: "Fluidscape", arquivo: "Fluidscape.mp3", genero: "Unclassifiable",
    feel: "Calming, Mystical, Relaxed", instrumentos: "Synths, Flute, Harp", bpm: null,
    porque: "Textura ambiente longa (30 min) sem tema cantado; flauta e harpa entram como cor, não como melodia. Serve de cama contínua para a primeira metade e não cansa em loop.",
    risco: "Harpa audível em alguns trechos; se soar 'etérea demais' no começo, é o risco a ouvir.",
  },
  {
    grupo: "A", titulo: "Tranquility", arquivo: "Tranquility.mp3", genero: "Electronica",
    feel: "Calming, Relaxed", instrumentos: "Synths", bpm: null,
    porque: "Só sintetizadores, sem instrumento acústico nenhum — a cama mais neutra da lista, boa para a curiosidade/descoberta sem puxar emoção.",
    risco: "Pode soar fria/estática demais para a abertura; tem 16 min e é bem uniforme.",
  },
  {
    grupo: "A", titulo: "Soaring", arquivo: "Soaring.mp3", genero: "Contemporary",
    feel: "Mystical, Calming, Relaxed", instrumentos: "Synths", bpm: null,
    porque: "Pad de sintetizador contínuo, 6 min, sem ataque rítmico — encaixa sob a perda contida sem melodrama.",
    risco: "Curta (6:20) e uniforme: precisa de loop para cobrir metade do vídeo.",
  },
  {
    grupo: "A", titulo: "Light Awash", arquivo: "Light Awash.mp3", genero: "Contemporary",
    feel: "Bright, Uplifting, Relaxed", instrumentos: null, bpm: null,
    porque: "Ambiente luminoso de 29 min, já com leve coloração de esperança — ponte natural entre o começo e o recomeço.",
    risco: "É mais 'bright' que as outras do grupo A; se a primeira metade pedir introspecção, pode adiantar emoção cedo.",
  },
  {
    grupo: "A", titulo: "Ever Mindful", arquivo: "Ever Mindful.mp3", genero: "Soundtrack",
    feel: "Relaxed, Bright, Calming", instrumentos: "Cellos, Basses, Violas, Violins, Choir, Flutes, Clarinets", bpm: 40,
    porque: "Cordas com coro e madeiras a 40 bpm: é a única do grupo A realmente orquestral e calorosa, o que aproxima do som de documentário.",
    risco: "Sem página no filmmusic.io (URL null no CSV) e ausente do catálogo 2020 — o crédito sai pela incompetech.com, não pelo slug do site.",
  },
  {
    grupo: "B", titulo: "Odyssey", arquivo: "Odyssey.mp3", genero: "Soundtrack",
    feel: "Bright, Uplifting, Mystical", instrumentos: "Synths", bpm: 80,
    porque: "Sintetizadores em modo descoberta/maravilhamento, crescendo sem bateria — casa com a criação do Mickey e o clímax caloroso.",
    risco: "Timbre de synth pode soar 'anos 2000'; é o mais datado do grupo B.",
  },
  {
    grupo: "B", titulo: "Airship Serenity", arquivo: "Airship Serenity.mp3", genero: "Electronica",
    feel: "Calming, Uplifting", instrumentos: "Synths", bpm: 74,
    porque: "Elevação calma e contínua, sem pico agressivo: bom para a virada que ainda não é clímax.",
    risco: "Eletrônica limpa demais para o clima 1928; a escolha é estética.",
  },
  {
    grupo: "B", titulo: "Numinous Shine", arquivo: "Numinous Shine.mp3", genero: "Contemporary",
    feel: "Bright, Uplifting, Relaxed", instrumentos: "Synth", bpm: 68,
    porque: "Brilho crescente e moderno, 4:18 — feito para os ~25 s finais, com resolução sem grandiosidade de trailer.",
    risco: "Sem cordas: o calor vem do synth, não de instrumento acústico.",
  },
  {
    grupo: "B", titulo: "Eternal Hope", arquivo: "Eternal Hope.mp3", genero: "Contemporary",
    feel: "Calming, Uplifting, Relaxed", instrumentos: "Piano, Strings, Helicon, French Horn, Choir", bpm: null,
    porque: "Cordas + coro + trompa: é a candidata mais calorosa e cinematográfica para o clímax emocional; o final resolve limpo.",
    risco: "TEM PIANO na instrumentação (pode virar piano dominante, que a série proíbe) — ouvir com atenção antes de escolher.",
  },
];

const faixas = TABELA.map((t) => {
  const m = medicoes[t.arquivo];
  if (!m) throw new Error(`sem medição para ${t.arquivo}`);
  return {
    grupo: t.grupo,
    titulo: t.titulo,
    artista: "Kevin MacLeod",
    licenca: LICENCA,
    credito: credito(t.titulo),
    origem: BASE + encodeURIComponent(t.arquivo),
    arquivo: t.arquivo,
    preview: m.preview,
    duracao_s: m.duracao_s,
    lufs_integrado: m.lufs,
    lra: m.lra,
    genero: t.genero,
    feel: t.feel,
    instrumentos: t.instrumentos,
    bpm: t.bpm,
    porque: t.porque,
    risco: t.risco,
  };
});

const manifest = {
  peca: "Disney v2",
  finalidade: "Seleção de trilha real (royalty-free) para o usuário ouvir e escolher. Nada mixado nem integrado nesta etapa.",
  fonte: "incompetech.com (Kevin MacLeod)",
  licenca: LICENCA,
  credito_obrigatorio: 'Crédito na descrição da publicação: "<Título>" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/',
  observacao_rotulos: "Genre/Feel/Instrumentos/BPM vêm de 'Incompetech Pieces 2020.csv' (metadados oficiais do site, baixados de archive.org/details/incompetech-all-the-music-2020). Onde o campo vinha vazio no CSV, ficou null — nada foi inferido.",
  gerado_em: new Date().toISOString().slice(0, 10),
  faixas,
};

writeFileSync(join(SRC, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`manifest.json: ${faixas.length} faixas (${faixas.filter((f) => f.grupo === "A").length} A, ${faixas.filter((f) => f.grupo === "B").length} B)`);
