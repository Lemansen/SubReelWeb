// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"commands.mdx": () => import("../content/docs/commands.mdx?collection=docs"), "faq.mdx": () => import("../content/docs/faq.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "launcher-auth.mdx": () => import("../content/docs/launcher-auth.mdx?collection=docs"), "launcher.mdx": () => import("../content/docs/launcher.mdx?collection=docs"), "map.mdx": () => import("../content/docs/map.mdx?collection=docs"), "rules.mdx": () => import("../content/docs/rules.mdx?collection=docs"), }),
};
export default browserCollections;