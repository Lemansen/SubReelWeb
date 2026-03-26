import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";

export default function WikiLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      containerProps={{
        className: "wiki-shell",
      }}
      sidebar={{
        banner: (
          <div className="wiki-sidebar-banner">
            <div className="wiki-sidebar-banner__eyebrow">Subreel Docs</div>
            <div className="wiki-sidebar-banner__title">Единая вики проекта</div>
            <div className="wiki-sidebar-banner__text">
              Лаунчер, сервер, правила и всё, что важно для игроков.
            </div>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
