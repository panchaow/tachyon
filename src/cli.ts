import { program } from "commander";
import pkg from "../package.json" assert { type: "json" };

program.version(pkg.version);

program.helpCommand(true);

program.parse();
