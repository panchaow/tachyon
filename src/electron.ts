import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
let electronApp: ChildProcess | undefined;

function getElectronPath(root: string) {
	const electronPkg = _require.resolve("electron", {
		paths: [root],
	});
	if (!electronPkg) {
		throw new Error("Electron is not installed");
	}

	return _require(electronPkg);
}

export function startElectron(root: string) {
	const electronPath = getElectronPath(root);

	if (electronApp) {
		electronApp.removeAllListeners();
		electronApp.kill();
		electronApp = undefined;
	}

	electronApp = spawn(electronPath, [root], { stdio: "inherit" });
	electronApp.on("exit", process.exit);
}
