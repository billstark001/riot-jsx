#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const REGISTRY = 'https://registry.npmjs.org';
const SCOPE = 'riot-jsx';
const PACKAGES = ['@riot-jsx/base', '@riot-jsx/redux', '@riot-jsx/preact', '@riot-jsx/react'];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
  };
}

function fail(message, detail = '') {
  console.error(`\n[publish-all] ${message}`);
  if (detail) {
    console.error(detail);
  }
  process.exit(1);
}

function checkNpmLogin() {
  const whoami = run('npm', ['whoami', '--registry', REGISTRY]);
  if (whoami.status !== 0) {
    fail('npm login check failed. Please run `npm login` first.', whoami.stderr || whoami.stdout);
  }
}

function checkScopeAccess() {
  const scopeAccess = run('npm', [
    'access',
    'list',
    'packages',
    SCOPE,
    '--json',
    '--registry',
    REGISTRY,
  ]);

  if (scopeAccess.status === 0) {
    return;
  }

  const errorText = `${scopeAccess.stderr}\n${scopeAccess.stdout}`.toLowerCase();
  if (errorText.includes('scope not found')) {
    fail(
      `npm scope @${SCOPE} does not exist yet.`,
      [
        `Create organization @${SCOPE} on npm first: https://www.npmjs.com/org/${SCOPE}`,
        'Then add your account to the org with publish permission and retry `pnpm publish-all`.',
      ].join('\n')
    );
  }

  fail(
    `Cannot verify access for @${SCOPE}.`,
    scopeAccess.stderr || scopeAccess.stdout
  );
}

function publishPackages() {
  for (const pkg of PACKAGES) {
    console.log(`\n[publish-all] publishing ${pkg} ...`);

    const result = run(
      'pnpm',
      [
        '--filter',
        pkg,
        'publish',
        '--access',
        'public',
        '--no-git-checks',
        '--registry',
        REGISTRY,
      ],
      { stdio: 'inherit' }
    );

    if (result.status !== 0) {
      process.exit(result.status);
    }
  }
}

checkNpmLogin();
checkScopeAccess();
publishPackages();

console.log('\n[publish-all] done.');
