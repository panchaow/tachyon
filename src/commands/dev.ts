import { Command } from "commander";
import {
	createServer,
	build as viteBuild,
	type ViteDevServer,
	createLogger,
	type UserConfig,
} from "vite";
import colors from "picocolors";
import { addSharedOptions, type GlobalOptions } from "../shared-options";
import { resolveConfig } from "../config";
import { defaultConfig } from "../default-config";
import { externalize } from "../externalize";
import { startElectron } from "../electron";
import { NODE_ENV_RENDERER_SERVER_URL } from "../constants";

export type ServerOptions = {
	autoRestart?: boolean;
	autoReloadPreload?: boolean;
};

export function buildDevCommand() {
	const program = new Command("dev");

	addSharedOptions(program);

	program
		.description("start development server")
		.argument("[root]", "project root directory.")
		.option("--auto-restart", "auto restart main process", true)
		.option("--auto-reload-preload", "auto reload preload scripts", true);

	program.action(
		async (root: string, options: GlobalOptions & ServerOptions) => {
			try {
				const config = await resolveConfig({
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
					autoRestart: options.autoRestart,
					autoReloadPreload: options.autoReloadPreload,
				});

				const sharedDefaults = {
					root: config.root,
					mode: config.mode,
					customLogger: config.logger,
					envDir: config.envDir,
					envPrefix: config.envPrefix,
				};

				let devServer: ViteDevServer | undefined;
				if (config.configFiles.renderer) {
					devServer = await createServer({
						configFile: config.configFiles.renderer,
						plugins: [
							defaultConfig({
								...sharedDefaults,
							}),
						],
					});

					await devServer.listen();
					const url = devServer.resolvedUrls?.local[0];
					process.env[NODE_ENV_RENDERER_SERVER_URL] = url;

					devServer.printUrls();
				}

				// build preload
				if (config.configFiles.preload) {
					await viteBuild({
						configFile: config.configFiles.preload,
						plugins: [
							defaultConfig({
								...sharedDefaults,
								publicDir: false,
								build: {
									watch: {},
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
									sourcemap: "inline",
									minify: false,
								},
								resolve: {
									conditions: ["node"],
									mainFields: ["module", "jsnext:source", "jsnext:main"],
								},
							}),
							externalize(),
							config.autoReloadPreload && {
								name: "@app/reload-preload",
								writeBundle() {
									devServer?.ws.send({
										type: "full-reload",
									});
								},
							},
						].filter(Boolean),
					});
				}

				// build main
				if (config.configFiles.main) {
					await viteBuild({
						configFile: config.configFiles.main,
						plugins: [
							defaultConfig({
								...sharedDefaults,
								publicDir: false,
								build: {
									watch: {},
									lib: {
										entry: "src/main.ts",
										formats: ["cjs"],
										fileName: "[name]",
									},
									outDir: "dist",
									emptyOutDir: false,
									sourcemap: "inline",
									minify: false,
								},
								resolve: {
									conditions: ["node"],
									mainFields: ["module", "jsnext:source", "jsnext:main"],
								},
							}),
							externalize(),
							config.autoRestart && {
								name: "@app/restart-main",
								writeBundle() {
									startElectron(config.root);
								},
							},
						].filter(Boolean),
					});
				} else {
					config.logger.warn(
						"Electron is not started because no main config file is found.",
					);
				}
			} catch (e) {
				createLogger(options.logLevel).error(
					colors.red(
						`error when starting dev server: ${e instanceof Error ? e.stack : e}`,
					),
					{ error: e instanceof Error ? e : undefined },
				);
				process.exit(1);
			}
		},
	);

	return program;
}
