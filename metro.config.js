// Monorepo-aware Metro config. Two adjustments are required so the
// example app can resolve workspace packages such as `@getrheo/react-native-expo` from
// the workspace root rather than only from this app's `node_modules`:
//
//   1. `watchFolders` - include the monorepo root so Metro re-bundles
//      when the SDK packages change.
//   2. `resolver.nodeModulesPaths` + `disableHierarchicalLookup` - tell
//      Metro to look for installed packages in the app's node_modules
//      AND in the workspace root's node_modules, then stop. Without
//      this, autolinking-sensitive native deps installed twice (per
//      `monorepo-native-deps-in-app`) can resolve from the wrong tree
//      and break the build.

const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

// pnpm keeps @getrheo/react-native-core under the expo package; Metro must map workspace names explicitly.
config.resolver.extraNodeModules = {
  '@getrheo/react-native-core': path.resolve(monorepoRoot, 'packages/sdks/react-native-core'),
  '@getrheo/react-native-expo': path.resolve(monorepoRoot, 'packages/sdks/react-native-expo'),
  '@getrheo/contracts': path.resolve(monorepoRoot, 'packages/contracts'),
  '@getrheo/flow-runtime': path.resolve(monorepoRoot, 'packages/flow-runtime'),
  '@getrheo/flow-ui-state': path.resolve(monorepoRoot, 'packages/flow-ui-state'),
  '@getrheo/renderer-core': path.resolve(monorepoRoot, 'packages/renderer-core'),
  '@getrheo/attribution': path.resolve(monorepoRoot, 'packages/attribution'),
};

// pnpm installs @rheo/react-native-* workspace deps under each SDK package.
const reactNativeSdkRoots = [
  path.resolve(monorepoRoot, 'packages/sdks/react-native-expo'),
  path.resolve(monorepoRoot, 'packages/sdks/react-native-core'),
].map((root) => path.resolve(root, 'node_modules'));

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
  ...reactNativeSdkRoots,
];
config.resolver.disableHierarchicalLookup = true;

// @getrheo/react-native-core sources use Node ESM `.js` import specifiers; Metro must map
// those to the `.ts` files in the workspace (no prebuild dist for local dev).
const defaultResolveRequest = config.resolver.resolveRequest;

// expo-superwall@1.2 exports `./compat` with only an `import` condition (no `require` /
// `default`). Metro's require() then fails with "Cannot find module 'expo-superwall/compat'".
// Map to the real files so host bootstrap + Rheo's presentSuperwallPaywall can load.
const resolveExpoSuperwallFile = (subpath) => {
  try {
    const pkgJson = require.resolve('expo-superwall/package.json', {
      paths: [projectRoot, monorepoRoot],
    });
    // exports maps `./package.json` → `build/package.json`
    const packageRoot = path.resolve(path.dirname(pkgJson), '..');
    if (subpath === 'compat') {
      return path.join(packageRoot, 'build/src/compat/index.js');
    }
    return path.join(packageRoot, 'build/src/index.js');
  } catch {
    return null;
  }
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolveModule = (name) => {
    if (defaultResolveRequest) {
      return defaultResolveRequest(context, name, platform);
    }
    return resolve(context, name, platform);
  };

  // With disableHierarchicalLookup, nested deps (e.g. reanimated's semver@7 while
  // the workspace root hoists babel's semver@6) are invisible. Fall back to Node
  // resolution from the importing file so those nested installs still resolve.
  const resolveWithNestedFallback = (name) => {
    try {
      return resolveModule(name);
    } catch (firstError) {
      if (!context.originModulePath || name.startsWith('.') || name.startsWith('/')) {
        throw firstError;
      }
      try {
        const filePath = require.resolve(name, {
          paths: [path.dirname(context.originModulePath)],
        });
        return { type: 'sourceFile', filePath };
      } catch {
        throw firstError;
      }
    }
  };

  if (moduleName === 'expo-superwall/compat' || moduleName === 'expo-superwall') {
    const filePath = resolveExpoSuperwallFile(
      moduleName === 'expo-superwall/compat' ? 'compat' : 'main',
    );
    if (filePath) {
      return { type: 'sourceFile', filePath };
    }
  }

  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const base = moduleName.slice(0, -3);
    for (const candidate of [`${base}.ts`, `${base}.tsx`, base]) {
      try {
        return resolveWithNestedFallback(candidate);
      } catch {
        // try next candidate
      }
    }
  }

  return resolveWithNestedFallback(moduleName);
};

module.exports = config;
