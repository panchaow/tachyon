import path from "node:path";
import fs from "node:fs";

export function findConfigFile(root: string, configName: string) {
	const exts = ["js", "ts", "mjs", "cjs", "mts", "cts"];

	for (const ext of exts) {
		const filePath = path.resolve(root, `${configName}.${ext}`);
		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}
}
