// Abre UM Chrome maximizado com porta de depuração e fica de pé; os outros scripts só se conectam a ele.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');
const exe = await puppeteer.executablePath();
const c = spawn(exe, ['--remote-debugging-port=9333', '--user-data-dir=' + process.env.TEMP + '\nav-profile', '--start-maximized', '--no-first-run', '--no-default-browser-check', 'about:blank'], { detached: true, stdio: 'ignore' });
c.unref();
console.log('chrome pid', c.pid, exe);
