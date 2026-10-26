import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// On GitHub Actions the owner/repo come from the environment, so the same config
// works for any fork or rename. Locally it falls back to a placeholder.
const [owner = 'your-github-username', repo = 'sharkzen-toast'] = (
  process.env.GITHUB_REPOSITORY ?? 'your-github-username/sharkzen-toast'
).split('/')

// A repo named <owner>.github.io is served from the domain root, any other repo from /<repo>.
const isUserSite = repo.toLowerCase() === `${owner}.github.io`.toLowerCase()
const site = `https://${owner}.github.io`
// Locally (no GITHUB_REPOSITORY) serve from the root so http://localhost:4321/ just works.
const onGitHub = Boolean(process.env.GITHUB_REPOSITORY)
const base = onGitHub && !isUserSite ? `/${repo}` : '/'
const url = `${site}${base === '/' ? '' : base}`
const repoUrl = `https://github.com/${owner}/${repo}`

const description =
  'Lightweight, dependency-free toast notifications for any web app. Works with vanilla JS, React, Next.js, Vue and Svelte. Themes, promise toasts, swipe to dismiss, responsive.'

export default defineConfig({
  site,
  base,
  vite: {
    // Docs import the library exactly like users do, but always run against the live source.
    resolve: { alias: { 'sharkzen-toast': fileURLToPath(new URL('../src/index.ts', import.meta.url)) } },
  },
  integrations: [
    starlight({
      title: 'Sharkzen Toast',
      description,
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        th: { label: 'ไทย', lang: 'th' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: repoUrl }],
      editLink: { baseUrl: `${repoUrl}/edit/main/docs/` },
      logo: { src: './src/assets/logo.svg' },
      components: { Hero: './src/components/Hero.astro' },
      // Fonts are served from the package itself: no third-party requests.
      customCss: [
        '@fontsource/prompt/600.css',
        '@fontsource/prompt/700.css',
        '@fontsource/ibm-plex-sans-thai/400.css',
        '@fontsource/ibm-plex-sans-thai/500.css',
        '@fontsource/ibm-plex-sans-thai/600.css',
        '@fontsource-variable/jetbrains-mono',
        './src/styles/custom.css',
      ],
      expressiveCode: {
        themes: ['night-owl', 'github-light'],
        styleOverrides: { borderRadius: '0.7rem', codeFontSize: '0.85rem' },
      },
      sidebar: [
        {
          label: 'Getting started',
          translations: { th: 'เริ่มต้นใช้งาน' },
          items: ['getting-started/installation', 'getting-started/usage'],
        },
        'playground',
        {
          label: 'Guides',
          translations: { th: 'คู่มือ' },
          items: ['guides/theming', 'guides/customizing', 'guides/promise-and-update'],
        },
        {
          label: 'API reference',
          translations: { th: 'อ้างอิง API' },
          items: ['api/toast', 'api/options'],
        },
        'faq',
      ],
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: `${url}/og.png` } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${url}/og.png` } },
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content: 'toast, notification, toast notification, react toast, vanilla js toast, nextjs toast, snackbar, typescript',
          },
        },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: 'Sharkzen Toast',
            description,
            programmingLanguage: 'TypeScript',
            codeRepository: repoUrl,
            url,
            license: 'https://opensource.org/licenses/MIT',
          }),
        },
      ],
    }),
  ],
})
