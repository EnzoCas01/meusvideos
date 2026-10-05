#!/usr/bin/env node
// Espera um processo terminar. Uso: node tools/espera-pid.mjs <pid>
const pid = Number(process.argv[2]);
const tick = () => {
	try {
		process.kill(pid, 0);
		console.log(`pid ${pid} vivo`);
	} catch {
		console.log(`pid ${pid} terminou`);
		process.exit(0);
	}
};
tick();
setInterval(tick, 120000);
