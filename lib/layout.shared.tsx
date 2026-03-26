import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: 'Lemansen',
  repo: 'SubReelWeb',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-accent-blue)] text-sm font-black uppercase text-white shadow-lg shadow-blue-500/20">
            S
          </span>
          <span className="text-base font-black uppercase tracking-[0.12em] text-[var(--color-text)]">
            Subreel Wiki
          </span>
        </span>
      ),
      url: '/wiki',
      transparentMode: 'none',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: 'Главная',
        url: '/',
        active: 'nested-url',
      },
      {
        text: 'Лаунчер',
        url: '/launcher',
        active: 'nested-url',
      },
      {
        text: 'Сервер',
        url: '/server',
        active: 'nested-url',
      },
      {
        text: 'Mobile',
        url: '/mobile',
        active: 'nested-url',
      },
    ],
  };
}
