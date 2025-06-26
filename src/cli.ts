import { program } from "commander";
import pkg from "../package.json" assert { type: "json" };
import { buildDevCommand } from "./commands/dev";
import { buildBuildCommand } from "./commands/build";

program.version(pkg.version);

program.addCommand(buildDevCommand(), { isDefault: true });
program.addCommand(buildBuildCommand());

program.helpCommand(true);

program.parse();
