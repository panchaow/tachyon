import fs from "node:fs";
import path from "node:path";
import { createLogger, type LogLevel, type Logger } from "vite";
import { normalizePath } from "./utils/normalize-path";
import {
	SYMBOL_RESOLVED_CONFIG,
	DEFAULT_MAIN_CONFIG_FILENAME,
	DEFAULT_PRELOAD_CONFIG_FILENAME,
	DEFAULT_RENDERER_CONFIG_FILENAME,
} from "./constants";

export interface RawConfig {
	mode?: string;
	logLevel?: LogLevel;
	root?: string;
	envDir?: string | false;
	envPrefix?: string | string[];
	configFiles?: {
		main?: string | false;
		preload?: string | false;
		renderer?: string | false;
	};
	autoRestart?: boolean;
	autoReloadPreload?: boolean;
}

export interface ResolvedConfig {
	[SYMBOL_RESOLVED_CONFIG]: true;
	root: string;
	mode: string;
	logger: Logger;
	envDir: string | false | undefined;
	envPrefix: string | string[] | undefined;
	rawConfig: RawConfig;
	configFiles: {
		main: string | undefined;
		preload: string | undefined;
		renderer: string | undefined;
	};
	autoRestart: boolean;
	autoReloadPreload: boolean;
}

export function isResolvedConfig(
	rawConfig: RawConfig | ResolvedConfig,
): rawConfig is ResolvedConfig {
	return (
		SYMBOL_RESOLVED_CONFIG in rawConfig && rawConfig[SYMBOL_RESOLVED_CONFIG]
	);
}

function findConfigFile(root: string, configName: string) {
	const exts = ["js", "ts", "mjs", "cjs", "mts", "cts"];

	for (const ext of exts) {
		const filePath = path.resolve(root, `${configName}.${ext}`);
		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}
}

export async function resolveConfig(
	rawConfig: RawConfig,
	defaultMode = "development",
	defaultNodeEnv = "development",
): Promise<ResolvedConfig> {
	const mode = rawConfig.mode || defaultMode;
	const isNodeEnvSet = !!process.env.NODE_ENV;

	if (!isNodeEnvSet) {
		process.env.NODE_ENV = defaultNodeEnv;
	}

	const logger = createLogger(rawConfig.logLevel, { allowClearScreen: true });
	const resolvedRoot = normalizePath(
		rawConfig.root ? path.resolve(rawConfig.root) : process.cwd(),
	);

	const configFiles = rawConfig.configFiles ?? {};

	let {
		main: mainConfigFile,
		preload: preloadConfigFile,
		renderer: rendererConfigFile,
	} = configFiles;

	if (mainConfigFile !== false) {
		mainConfigFile = mainConfigFile
			? path.resolve(mainConfigFile)
			: findConfigFile(resolvedRoot, DEFAULT_MAIN_CONFIG_FILENAME);
	}

	if (preloadConfigFile !== false) {
		preloadConfigFile = preloadConfigFile
			? path.resolve(preloadConfigFile)
			: findConfigFile(resolvedRoot, DEFAULT_PRELOAD_CONFIG_FILENAME);
	}

	if (rendererConfigFile !== false) {
		rendererConfigFile = rendererConfigFile
			? path.resolve(rendererConfigFile)
			: findConfigFile(resolvedRoot, DEFAULT_RENDERER_CONFIG_FILENAME);
	}

	return {
		root: resolvedRoot,
		mode,
		envDir: rawConfig.envDir,
		envPrefix: rawConfig.envPrefix,
		rawConfig,
		logger,
		configFiles: {
			main: mainConfigFile ? normalizePath(mainConfigFile) : undefined,
			preload: preloadConfigFile ? normalizePath(preloadConfigFile) : undefined,
			renderer: rendererConfigFile
				? normalizePath(rendererConfigFile)
				: undefined,
		},
		autoRestart: rawConfig.autoRestart ?? true,
		autoReloadPreload: rawConfig.autoReloadPreload ?? true,
		[SYMBOL_RESOLVED_CONFIG]: true,
	};
}
