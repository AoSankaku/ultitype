import { resolve, relative, sep } from "node:path";

type Options = { challengePath: string; baselineRef?: string };

function readOptions(args: string[]): Options {
  const challengePath = args.find((arg) => !arg.startsWith("--"));
  if (!challengePath) {
    throw new Error("Usage: bun scripts/verify-long-direct-performance.ts <challenge-text-path> [--baseline-ref=<git-ref>]");
  }

  const baselineOption = args.find((arg) => arg.startsWith("--baseline-ref="));
  if (args.some((arg) => arg.startsWith("--") && !arg.startsWith("--baseline-ref="))) {
    throw new Error("The only supported option is --baseline-ref=<git-ref>.");
  }

  return { challengePath: resolve(challengePath), baselineRef: baselineOption?.slice("--baseline-ref=".length) };
}

function gitText(args: string[], projectRoot: string) {
  const result = Bun.spawnSync(["git", ...args], { cwd: projectRoot });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || `git ${args[0]} failed.`);
  }
  return result.stdout.toString();
}

async function main() {
  const projectRoot = process.cwd();
  const { challengePath, baselineRef } = readOptions(process.argv.slice(2));
  const challengeFile = Bun.file(challengePath);
  if (!(await challengeFile.exists())) {
    throw new Error(`Challenge text not found: ${challengePath}`);
  }
  const challengeText = await challengeFile.text();
  if (baselineRef) {
    gitText(["rev-parse", "--verify", `${baselineRef}^{commit}`], projectRoot);
  }

  const fixturePath = resolve(projectRoot, "scripts/fixtures/long-direct-performance.tsx");
  const bundle = await Bun.build({
    entrypoints: [fixturePath],
    target: "browser",
    plugins: [{
      name: "long-direct-performance-fixture",
      setup(build) {
        build.onResolve({ filter: /^virtual:long-direct-challenge$/ }, () => ({
          path: "challenge-source",
          namespace: "long-direct-performance",
        }));
        build.onLoad({ filter: /.*/, namespace: "long-direct-performance" }, () => ({
          contents: `export default ${JSON.stringify(challengeText)};`,
          loader: "js",
        }));
        build.onLoad({ filter: /\.module\.css$/ }, () => ({
          contents: "export default new Proxy({}, { get: (_target, key) => key });",
          loader: "js",
        }));

        if (baselineRef) {
          build.onLoad({
            filter: /(?:production-long-display|continuous-challenge-text-stack|center-scroll-viewport)\.tsx$/,
          }, ({ path }) => {
            const repoPath = relative(projectRoot, path).split(sep).join("/");
            const committedSource = gitText(["show", `${baselineRef}:${repoPath}`], projectRoot);
            return { contents: committedSource, loader: "tsx" };
          });
        }
      },
    }],
  });

  if (!bundle.success) {
    throw new Error(bundle.logs.map((log) => log.message).join("\n"));
  }
  const scriptBundle = bundle.outputs.find((output) => output.path.endsWith(".js"));
  if (!scriptBundle) {
    throw new Error("The browser fixture did not produce a JavaScript bundle.");
  }
  const bundledFixture = await scriptBundle.text();

  // Use Node for Playwright's transport; Bun builds the browser fixture in memory.
  const browserProcess = Bun.spawn([
    process.env.ULTITYPE_NODE_EXECUTABLE ?? "node",
    resolve(projectRoot, "scripts/verify-long-direct-performance.browser.mjs"),
  ], { stdin: "pipe", stdout: "inherit", stderr: "inherit" });
  browserProcess.stdin.write(JSON.stringify({
    challengePath,
    baselineRef: baselineRef ?? null,
    bundledFixture,
    typingPanelCss: await Bun.file(resolve(projectRoot, "app/_components/TypingPanel.module.css")).text(),
  }));
  browserProcess.stdin.end();
  const exitCode = await browserProcess.exited;
  if (exitCode !== 0) throw new Error(`Browser verification failed with exit code ${exitCode}.`);
}

await main();
