import { mergeConfig, type Plugin, type UserConfig } from "vite";

export function defaultConfig(defaults: Omit<UserConfig, "plugins">): Plugin {
	return {
		name: "@app/default-config",
		config(config) {
			return mergeConfig(defaults, config);
		},
	};
}
