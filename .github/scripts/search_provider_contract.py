from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, got {count}: {old!r}')
    p.write_text(text.replace(old, new, 1))


replace_once(
    'src/types.ts',
    """export interface ContributionSearchProvider {
  id: string;
  label: string;
  handler: string;
}
""",
    """export interface ContributionSearchProvider {
  id: string;
  label: string;
  handler: string;
}

/** Query passed to a search provider. Omit workspaceRootPath for vault-global search. */
export interface SearchProviderRequest {
  query: string;
  /** Canonical Deal root. Missing or empty means the whole vault. */
  workspaceRootPath?: string;
  /** Maximum number of results requested from this provider. */
  limit?: number;
}

/** A search result can navigate without exposing provider-private storage details. */
export type SearchActionTarget =
  | {
      kind: 'workspace';
      workspaceRootPath: string;
    }
  | {
      kind: 'workspace-item';
      workspaceRootPath: string;
      workspaceItemId: string;
      toolRequest?: Record<string, unknown>;
    }
  | {
      kind: 'view';
      viewId: string;
      pluginId?: string;
    }
  | {
      kind: 'resource';
      resource: OpenResourceRequest;
    };

/** One normalized result returned by a search provider. */
export interface SearchProviderResult {
  id: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  /** Stable category id for grouping/filtering. */
  categoryId?: string;
  /** Optional localized category label. */
  categoryLabel?: string;
  /** Higher scores are more relevant. Aggregators may combine provider results. */
  score?: number;
  action?: SearchActionTarget;
}

export interface SearchProviderResponse {
  results: SearchProviderResult[];
  /** True when the provider intentionally returned an incomplete result set. */
  partial?: boolean;
}
""",
)

replace_once(
    'schemas/contributions.json',
    '"description": "Search result providers",',
    '"description": "Normalized search providers. Queries may be vault-global or scoped to one Deal; providers own indexing and data semantics.",',
)

print('Search provider SDK contract patched')
