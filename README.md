# rheo-example-expo

Runnable **Expo** sample for [`@getrheo/react-native-expo`](https://www.npmjs.com/package/%40getrheo%2Freact-native-expo) — config screen, then `RheoProvider` + `Flow`.

Not published to npm.

## Quick start

```bash
git clone https://github.com/getrheo/rheo-example-expo.git
cd rheo-example-expo
cp .env.example .env   # optional — override API URL for local dev
pnpm install
pnpm start
```

The config screen defaults to **`https://api.getrheo.io`**. Use `http://localhost:4000` (iOS sim) or `http://10.0.2.2:4000` (Android emulator) when testing against a local API.

Enter your **publishable key** (`ob_pk_test_…`) and **channel id** from the Rheo dashboard, then tap **Start flow**.

## SDK repository

[rheo-react-native](https://github.com/getrheo/rheo-react-native)

## Development

```bash
pnpm install
pnpm verify   # lint, typecheck, tests
```

[Documentation](https://docs.getrheo.io/docs/developer-guide/sdk-expo) · [CONTRIBUTING](./CONTRIBUTING.md) · [MIT](./LICENSE)
