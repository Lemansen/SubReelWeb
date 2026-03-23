import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";

type WikiPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: WikiPageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: `${page.data.title} | Subreel Wiki`,
    description: page.data.description,
  };
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const pageData = page.data as typeof page.data & {
    body: ComponentType<{ components?: ReturnType<typeof getMDXComponents> }>;
    toc?: unknown[];
  };
  const MDXContent = pageData.body;

  return (
    <DocsPage toc={pageData.toc}>
      <DocsTitle>{pageData.title}</DocsTitle>
      <DocsDescription>{pageData.description}</DocsDescription>
      <DocsBody>
        <MDXContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
