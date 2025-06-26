import type { Plugin } from "vite";
import { builtinModules } from "node:module";

export function externalize(): Plugin {
	const _external = ["electron", ...builtinModules.map((m) => `node:${m}`)];

	return {
		name: "@app/externalize",
		config(config) {
			config.build ??= {};
			config.build.rollupOptions ??= {};

			let external = config.build.rollupOptions.external;

			if (typeof external === "function") {
				const original = external;
				external = (source, importer, isResolved) => {
					if (_external.includes(source)) {
						return true;
					}
					return original(source, importer, isResolved);
				};
			} else if (
				Array.isArray(external) ||
				typeof external === "string" ||
				external instanceof RegExp
			) {
				external = (_external as (string | RegExp)[]).concat(external);
			} else {
				external = _external;
			}
			config.build.rollupOptions.external = external;
		},
	};
}
