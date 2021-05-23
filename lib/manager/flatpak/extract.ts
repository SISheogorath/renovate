import { safeLoad } from 'js-yaml';
import * as gitRefs from '../../datasource/git-refs';
import * as gitTags from '../../datasource/git-tags';
import type { PackageDependency, PackageFile } from '../types';

export function extractPackageFile(content: string): PackageFile {
  const deps: PackageDependency[] = [];

  const flatpakSpec = safeLoad(content);
  for (let i = 0; i < flatpakSpec.modules.length; i++) {
    const module = flatpakSpec.modules[i];

    // module can be strings that reference other files
    // these will not be handled here
    if (typeof module === 'String') {
      continue;
    }

    // a module without sources can't be handled here
    if (!module.sources || typeof module.sources !== 'object') {
      continue;
    }

    for (let j = 0; j < module.sources.length; j++) {
      const source = module.sources[j];
      if (source.type !== 'git') {
        continue;
      }

      if (source.tag) {
        deps.push({
          datasource: gitTags.id,
          depName: `${module.name}-${j}`,
          lookupName: source.url,
          currentVersion: source.tag,
        });
      }

      if (source.commit) {
        deps.push({
          datasource: gitRefs.id,
          depName: `${module.name}-${j}`,
          lookupName: source.url,
          currentVersion: source.commit,
        });
      }
    }
  }

  return { deps };
}
