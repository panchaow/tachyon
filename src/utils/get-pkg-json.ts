import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

export async function getPkgJson(root: string) {
	const pkgJsonPath = resolve(root, "package.json");
	const pkgJson = await readFile(pkgJsonPath, "utf-8");
	return JSON.parse(pkgJson) as { type?: string; main?: string };
}
