import path from "node:path";

const hasPathPrefixPattern = /^[/.]/;

export const normalizePath = (filePath: string, isDirectory?: boolean) => {
	let normalized = filePath;
	if (
		!path.isAbsolute(filePath) && // Windows paths starts with C:\\
		!hasPathPrefixPattern.test(filePath)
	) {
		normalized = `./${filePath}`;
	}

	if (isDirectory && !filePath.endsWith("/")) {
		normalized += "/";
	}

	return normalized;
};
