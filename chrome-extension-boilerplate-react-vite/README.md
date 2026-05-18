# Lumen Pronunciation — Developer Guide

Chrome extension yang menampilkan fonetik IPA, warna vokal, dan terjemahan di atas teks Inggris. Stack: React + TypeScript + Vite + Supabase + Stripe.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node >= 20 | `nvm install 20` |
| pnpm | `npm i -g pnpm` |
| Supabase CLI | `brew install supabase/tap/supabase` |

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd chrome-extension-boilerplate-react-vite
pnpm install
```

---

## 2. Environment Variables

Buat file `.env` di root project:

```bash
cp .env.example .env 2>/dev/null || touch .env
```

Isi `.env`:

```env
CEB_SUPABASE_URL=https://sxqojqgmswxlmsjtzyce.supabase.co
CEB_SUPABASE_ANON_KEY=<anon key dari Supabase Dashboard → Settings → API>
```

> Secret key Stripe dan Supabase service role **tidak boleh** ada di `.env` — hanya di Supabase secrets.

---

## 3. Development (Extension)

```bash
pnpm dev
```

Lalu load di Chrome:
1. Buka `chrome://extensions`
2. Aktifkan **Developer mode**
3. Klik **Load unpacked** → pilih folder `dist`

Extension otomatis hot-reload saat kode berubah.

---

## 4. Build Production

```bash
pnpm build        # Chrome
pnpm build:firefox # Firefox
pnpm zip          # Buat .zip siap upload ke Chrome Web Store
```

---

## 5. Supabase Setup

### Link project

```bash
supabase login
supabase link --project-ref sxqojqgmswxlmsjtzyce
```

### Set secrets (Stripe + service role)

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_MONTHLY=price_...
supabase secrets set STRIPE_PRICE_YEARLY=price_...
supabase secrets set SERVICE_ROLE_KEY=eyJ...
```

### Database migration

Jalankan SQL di Supabase Dashboard → SQL Editor:

```sql
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_id text,
  add column if not exists subscription_status text default 'inactive';
```

### Deploy Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

---

## 6. Supabase Storage (Halaman Sukses Stripe)

Upload halaman redirect setelah checkout berhasil:

```bash
# Edit dulu supabase/storage/upload.sh — isi SERVICE_ROLE_KEY dengan key kamu
# (file ini sudah di .gitignore — jangan commit)
bash supabase/storage/upload.sh
```

Script ini:
1. Membuat bucket `pages` (public) di Supabase Storage
2. Upload `supabase/storage/pro-activated.html`
3. Re-deploy `create-checkout-session`

---

## 7. Stripe Setup

1. Buka [Stripe Dashboard (test mode)](https://dashboard.stripe.com/test)
2. Products → **New product** → "Lumen Pro"
   - Price 1: $4 / month → catat `price_id` → set sebagai `STRIPE_PRICE_MONTHLY`
   - Price 2: $36 / year → catat `price_id` → set sebagai `STRIPE_PRICE_YEARLY`
3. Developers → Webhooks → **Add endpoint**:
   - URL: `https://sxqojqgmswxlmsjtzyce.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Catat webhook secret → set sebagai `STRIPE_WEBHOOK_SECRET`

---

## 8. Test Pembayaran

Gunakan kartu test Stripe:

| Field | Value |
|-------|-------|
| Card number | `4242 4242 4242 4242` |
| Expiry | Tanggal mana saja di masa depan |
| CVC | `123` |

Setelah checkout → cek tabel `profiles` di Supabase → `tier` harus jadi `pro`.

---

## 9. Type Check

```bash
pnpm type-check
```

---

## Struktur Penting

```
chrome-extension/src/background/  — service worker (Stripe + auth message handlers)
pages/popup/src/Popup.tsx          — popup UI (upgrade button, locked opts)
pages/options/src/Options.tsx      — options page (account, billing, settings)
pages/content/src/matches/all/    — content script (feature gating per tier)
packages/storage/lib/impl/         — ipa-auth-storage, ipa-settings-storage
supabase/functions/                — edge functions (Deno)
supabase/migrations/               — SQL migrations
supabase/storage/                  — static pages (pro-activated.html)
```

---

<div align="center">

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/99cb6303-64e4-4bed-bf3f-35735353e6de" />
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/a5dbf71c-c509-4c4f-80f4-be88a1943b0a" />
    <img alt="Logo" src="https://github.com/user-attachments/assets/99cb6303-64e4-4bed-bf3f-35735353e6de" />
</picture>

![](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![](https://img.shields.io/badge/Typescript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![](https://badges.aleen42.com/src/vitejs.svg)

![GitHub action badge](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/actions/workflows/build-zip.yml/badge.svg)
![GitHub action badge](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/actions/workflows/lint.yml/badge.svg)

<a href="https://discord.gg/4ERQ6jgV9a" target="_blank"><img src="https://discord.com/api/guilds/1263404974830915637/widget.png"/></a>

> This boilerplate
> has [Legacy version](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/tree/legacy)

</div>

> [!NOTE]
> This project is listed in the [Awesome Vite](https://github.com/vitejs/awesome-vite)

> [!TIP]
> Share storage state between all pages
>
> https://github.com/user-attachments/assets/3b8e189f-6443-490e-a455-4f9570267f8c

## Table of Contents

- [Intro](#intro)
- [Features](#features)
- [Structure](#structure)
    - [ChromeExtension](#structure-chrome-extension)
    - [Packages](#structure-packages)
    - [Pages](#structure-pages)
- [Installation](#installation)
    - [Chrome](#installation-chrome)
    - [Firefox](#installation-firefox)
- [Install dependency](#install-dependency)
    - [For root](#install-dependency-for-root)
    - [For module](#install-dependency-for-module)
- [Environment variables](#env-variables)
    - [Add new](#env-variables-new)
    - [Set via CLI](#env-variables-cli-set)
- [Troubleshooting](#troubleshooting)
    - [Hot module reload seems to have frozen](#hot-module-reload-seems-to-have-frozen)
    - [Imports not resolving correctly](#imports-not-resolving-correctly)
- [Community](#community)
- [Debugging](#debugging)
- [Reference](#reference)
- [Star History](#star-history)
- [Contributors](#contributors)

## Intro

This boilerplate helps you create Chrome/Firefox extensions using React and Typescript. It improves
the build speed and development experience by using Vite and Turborepo.

## Features

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwindcss](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/) with [Rollup](https://rollupjs.org/)
- [Turborepo](https://turbo.build/repo)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
- [Chrome Extensions Manifest Version 3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Custom i18n package](/packages/i18n/)
- [Custom HMR (Hot Module Rebuild) plugin](/packages/hmr)
- [End-to-end testing with WebdriverIO](https://webdriver.io/)

## Installation

1. Clone this repository.( ```git clone https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite``` )
2. Ensure your node version is >= than in `.nvmrc` file, recommend to use [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#intro)
3. Edit `/packages/i18n/locales/`{your locale(s)}/`messages.json`
4. In the objects `extensionDescription` and `extensionName`, change the `message` fields (leave `description` alone)
5. Install pnpm globally: `npm install -g pnpm`
6. Run `pnpm install`
7. Check if you have that configuration in your IDE/Editor:
    - <b>VS Code</b>:
        - Installed [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
        - Installed [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
        - Enabled `Typescript Workbench version` in settings:
            - CTRL + SHIFT + P -> Search: `Typescript: Select Typescript version...` -> `Use Workbench version`
            - [Read more](https://code.visualstudio.com/docs/languages/typescript#_using-newer-typescript-versions)
        - Optional, for imports to work correctly in WSL, you might need to install the [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) extension and connect to WSL remotely from VS Code. See overview section in the extension page for more information.
    - <b>WebStorm</b>:
      - Configured [ESLint](https://www.jetbrains.com/help/webstorm/eslint.html#ws_eslint_configure_run_eslint_on_save)
      - Configured [Prettier](https://prettier.io/docs/en/webstorm.html)
      - Optional, but useful `File | Settings | Tools | Actions on Save`\
      -> `Optimize imports` and `Reformat code`
8. Run `pnpm update-version <version>` for change the `version` to the desired version of your extension.

> [!IMPORTANT]
> On Windows, make sure you have WSL enabled and Linux distribution (e.g. Ubuntu) installed on WSL.
> 
> [Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)

<b>Then, depending on the target browser:</b>

### For Chrome: <a name="installation-chrome"></a>

1. Run:
    - Dev: `pnpm dev` (on Windows, you should run as administrator;
      see [issue#456](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/456))
    - Prod: `pnpm build`
2. Open in browser - `chrome://extensions`
3. Check - <kbd>Developer mode</kbd>
4. Click - <kbd>Load unpacked</kbd> in the upper left corner
5. Select the `dist` directory from the boilerplate project

### For Firefox: <a name="installation-firefox"></a>

1. Run:
    - Dev: `pnpm dev:firefox`
    - Prod: `pnpm build:firefox`
2. Open in browser - `about:debugging#/runtime/this-firefox`
3. Click - <kbd>Load Temporary Add-on...</kbd> in the upper right corner
4. Select the `./dist/manifest.json` file from the boilerplate project

> [!NOTE]
> In Firefox, you load add-ons in temporary mode. That means they'll disappear after each browser close. You have to
> load the add-on on every browser launch.

## Install dependency for turborepo: <a name="install-dependency"></a>

### For root: <a name="install-dependency-for-root"></a>

1. Run `pnpm i <package> -w`

### For module: <a name="install-dependency-for-module"></a>

1. Run `pnpm i <package> -F <module name>`

`package` - Name of the package you want to install e.g. `nodemon` \
`module-name` - You can find it inside each `package.json` under the key `name`, e.g. `@extension/content-script`, you
can use only `content-script` without `@extension/` prefix

## How do I disable modules I'm not using?

[Read here](packages/module-manager/README.md)

## Environment variables

Read: [Env Documentation](packages/env/README.md)

## Boilerplate structure <a name="structure"></a>

### Chrome extension <a name="structure-chrome-extension"></a>

The extension lives in the `chrome-extension` directory and includes the following files:

- [`manifest.ts`](chrome-extension/manifest.ts) - script that outputs the `manifest.json`
- [`src/background`](chrome-extension/src/background) - [background script](https://developer.chrome.com/docs/extensions/mv3/background_pages/)
  (`background.service_worker` in manifest.json)
- [`public`](chrome-extension/public/) - icons referenced in the manifest; content CSS for user's page injection

> [!IMPORTANT]
> To facilitate development, the boilerplate is configured to "Read and change all your data on all websites".
> In production, it's best practice to limit the premissions to only the strictly necessary websites. See
> [Declaring permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
> and edit `manifest.js` accordingly.

### Pages <a name="structure-pages"></a>

Code that is transpiled to be part of the extension lives in the [pages](pages) directory.

- [`content`](pages/content) - Scripts injected into specified pages (You can see it in console)
- [`content-ui`](pages/content-ui) - React Components injected into specified pages (You can see it at the very bottom of pages)
- [`content-runtime`](pages/content-runtime/src/) - [injected content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#functionality)
  This can be injected from e.g. `popup` like standard `content`
- [`devtools`](pages/devtools/) - [extend the browser DevTools](https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools#creating)
  (`devtools_page` in manifest.json)
- [`devtools-panel`](pages/devtools-panel/) - [DevTools panel](https://developer.chrome.com/docs/extensions/reference/api/devtools/panels)
  for [devtools](pages/devtools/src/index.ts)
- [`new-tab`](pages/new-tab/) - [override the default New Tab page](https://developer.chrome.com/docs/extensions/develop/ui/override-chrome-pages)
  (`chrome_url_overrides.newtab` in manifest.json)
- [`options`](pages/options/) - [options page](https://developer.chrome.com/docs/extensions/develop/ui/options-page)
  (`options_page` in manifest.json)
- [`popup`](pages/popup/) - [popup](https://developer.chrome.com/docs/extensions/reference/api/action#popup) shown when
  clicking the extension in the toolbar
  (`action.default_popup` in manifest.json)
- [`side-panel`](pages/side-panel/) - [sidepanel (Chrome 114+)](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
  (`side_panel.default_path` in manifest.json)

### Packages <a name="structure-packages"></a>

Some shared packages:

- `dev-utils` - utilities for Chrome extension development (manifest-parser, logger)
- `env` - exports object which contain all environment variables from `.env` and dynamically declared
- `hmr` - custom HMR plugin for Vite, injection script for reload/refresh, HMR dev-server
- `i18n` - custom internationalization package; provides i18n function with type safety and other validation
- `shared` - shared code for the entire project (types, constants, custom hooks, components etc.)
- `storage` - helpers for easier integration with [storage](https://developer.chrome.com/docs/extensions/reference/api/storage), e.g. local/session storages
- `tailwind-config` - shared Tailwind config for entire project
- `tsconfig` - shared tsconfig for the entire project
- `ui` - function to merge your Tailwind config with the global one; you can save components here
- `vite-config` - shared Vite config for the entire project

Other useful packages:

- `zipper` - run `pnpm zip` to pack the `dist` folder into `extension-YYYYMMDD-HHmmss.zip` inside the newly created
  `dist-zip`
- `module-manager` - run `pnpm module-manager` to enable/disable modules
- `e2e` - run `pnpm e2e` for end-to-end tests of your zipped extension on different browsers

## Troubleshooting

### Hot module reload seems to have frozen

If saving source files doesn't cause the extension HMR code to trigger a reload of the browser page, try this:

1. Ctrl+C the development server and restart it (`pnpm run dev`)
2. If you get a [`grpc` error](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/612),
   [kill the
   `turbo` process](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/612#issuecomment-2518982339)
   and run `pnpm dev` again.

### Imports not resolving correctly

If you are using WSL and imports are not resolving correctly, ensure that you have connected VS Code to WSL remotely using the [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) extension.

## Community

To chat with other community members, you can join the [Discord](https://discord.gg/4ERQ6jgV9a) server.
You can ask questions on that server, and you can also help others.

Also, suggest new features or share any challenges you've faced while developing Chrome extensions!

## Debugging

If you're debugging one, you can use [Brie](https://go.briehq.com/github?utm_source=CEB) lets you capture screenshots, errors, and network activity, making it easier for us to help.

## Reference

- [Chrome Extensions](https://developer.chrome.com/docs/extensions)
- [Vite Plugin](https://vitejs.dev/guide/api-plugin.html)
- [Rollup](https://rollupjs.org/guide/en/)
- [Turborepo](https://turbo.build/repo/docs)
- [Rollup-plugin-chrome-extension](https://www.extend-chrome.dev/rollup-plugin)

## Star History <a name="star-history"></a>

<a href="https://star-history.com/#Jonghakseo/chrome-extension-boilerplate-react-vite&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Jonghakseo/chrome-extension-boilerplate-react-vite&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Jonghakseo/chrome-extension-boilerplate-react-vite&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Jonghakseo/chrome-extension-boilerplate-react-vite&type=Date" />
 </picture>
</a>

## Contributors <a name="contributors"></a>

This Boilerplate is made possible thanks to all of its contributors.

<a href="https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/graphs/contributors">
  <img width="500px" src="https://contrib.rocks/image?repo=Jonghakseo/chrome-extension-boilerplate-react-vite" alt="All Contributors"/>
</a>

---

## Special Thanks To

| <a href="https://jb.gg/OpenSourceSupport"><img width="40" src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.png" alt="JetBrains Logo (Main) logo."></a> | <a href="https://www.linkedin.com/in/j-acks0n"><img width="40" style="border-radius:50%" src='https://avatars.githubusercontent.com/u/23139754' alt='Jackson Hong'/></a> |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

---

Made by [Jonghakseo](https://jonghakseo.github.io/)
