import { readFileSync } from 'node:fs';
import type { ManifestType } from '@extension/shared';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: ['<all_urls>'],
  permissions: ['storage', 'tabs', 'identity'],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-32.png',
  },
  icons: {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '64': 'icon-64.png',
    '128': 'icon-128.png',
    '256': 'icon-256.png',
    '512': 'icon-512.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['content/all.iife.js'],
      css: ['content.css'],
      run_at: 'document_idle',
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        '*.js',
        '*.css',
        '*.svg',
        'icon-16.png',
        'icon-32.png',
        'icon-64.png',
        'icon-128.png',
        'icon-256.png',
        'icon-512.png',
        'en-BrE-pronunciation.txt',
        'en-NAmE-pronunciation.txt',
        'en-baseforms.json',
        'en-BrE-audios.txt',
        'en-NAmE-audios.txt',
      ],
      matches: ['*://*/*'],
    },
  ],
  browser_specific_settings: {
    gecko: {
      id: 'lumen-pronounce@wildanmhd.dev',
      data_collection_permissions: {
        required: ['none'],
      },
    },
  },
} satisfies ManifestType;

export default manifest;
