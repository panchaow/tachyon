import { Command } from "commander";
import colors from "picocolors";
import { addSharedOptions, type GlobalOptions } from "../shared-options";
import { build as viteBuild, createLogger } from "vite";
import { resolveConfig } from "../config";
import { defaultConfig } from "../default-config";
import { externalize } from "../externalize";

// biome-ignore lint/complexity/noBannedTypes: <placeholder>
export type BuildOptions = {};

export function buildBuildCommand() {
	const program = new Command("build");

	addSharedOptions(program);

	program
		.description("build the project")
		.argument("[root]", "project root directory.");

	program.action(
		async (root: string, options: GlobalOptions & BuildOptions) => {
			try {
				const config = await resolveConfig(
					{
						root,
						mode: options.mode,
						logLevel: options.logLevel,
						envDir: options.envDir,
						envPrefix: options.envPrefix,
						configFiles: {
							main: options["config.main"],
							preload: options["config.preload"],
							renderer: options["config.renderer"],
						},
					},
					"production",
					"production",
				);

				const sharedDefaults = {
					root: config.root,
					mode: config.mode,
					customLogger: config.logger,
					envDir: config.envDir,
					envPrefix: config.envPrefix,
				};

				if (config.configFiles.renderer) {
					await viteBuild({
						configFile: config.configFiles.renderer,
						plugins: [
							defaultConfig({
								...sharedDefaults,
								base: "./",
							}),
						],
					});
				}

				if (config.configFiles.preload) {
					await viteBuild({
						configFile: config.configFiles.preload,
						plugins: [
							defaultConfig({
								...sharedDefaults,
								publicDir: false,
								build: {
									rollupOptions: {
										input: "src/preload.ts",
										output: {
											format: "cjs",
											inlineDynamicImports: true,
											entryFileNames: "[name].js",
										},
									},
									outDir: "dist",
									emptyOutDir: false,
								},
								resolve: {
									conditions: ["node"],
									mainFields: ["module", "jsnext:source", "jsnext:main"],
								},
							}),
							externalize(),
						],
					});
				}

				if (config.configFiles.main) {
					await viteBuild({
						configFile: config.configFiles.main,
						plugins: [
							defaultConfig({
								...sharedDefaults,
								publicDir: false,
								build: {
									lib: {
										entry: "src/main.ts",
										formats: ["cjs"],
										fileName: "[name]",
									},
									outDir: "dist",
									emptyOutDir: false,
								},
								resolve: {
									conditions: ["node"],
									mainFields: ["module", "jsnext:source", "jsnext:main"],
								},
							}),
							externalize(),
						],
					});
				}
			} catch (e) {
				createLogger(options.logLevel).error(
					colors.red(
						`error when building the project: ${e instanceof Error ? e.stack : e}`,
					),
					{ error: e instanceof Error ? e : undefined },
				);
				process.exit(1);
			}
		},
	);

	return program;
}
