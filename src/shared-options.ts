import type { Command } from "commander";

export type GlobalOptions = {
	logLevel?: "info" | "warn" | "error" | "silent";
	mode?: string;
	envDir?: string | false;
	envPrefix?: string[];
	"config.main"?: string;
	"config.preload"?: string;
	"config.renderer"?: string;
};

export function addSharedOptions(command: Command) {
	command
		.option("-m, --mode <mode>", "set env mode")
		.option("-l, --logLevel <level>", "info | warn | error | silent")
		.option("--env-dir <dir>", "path to env directory")
		.option("--no-env-dir", "disable env directory")
		.option(
			"--env-prefix <prefix>",
			"prefix for env variables",
			(v: string, pre: string[]) => pre.concat(v),
			[],
		)
		.option("--config.main <path>", "path to config file for main scripts")
		.option(
			"--config.preload <path>",
			"path to config file for preload scripts",
		)
		.option(
			"--config.renderer <path>",
			"path to config file for renderer scripts",
		);
}
