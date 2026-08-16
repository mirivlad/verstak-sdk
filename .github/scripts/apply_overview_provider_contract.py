from pathlib import Path
import json

TYPES = Path('src/types.ts')
text = TYPES.read_text()

old = """  searchProviders?: ContributionSearchProvider[];\n  activityProviders?: ContributionActivityProvider[];\n  statusBarItems?: ContributionStatusBarItem[];"""
new = """  searchProviders?: ContributionSearchProvider[];\n  activityProviders?: ContributionActivityProvider[];\n  worklogProviders?: ContributionWorklogProvider[];\n  overviewProviders?: ContributionOverviewProvider[];\n  statusBarItems?: ContributionStatusBarItem[];"""
assert old in text
text = text.replace(old, new, 1)

old = """export interface ContributionActivityProvider {\n  id: string;\n  events?: string[];\n  handler: string;\n}\n\nexport interface ContributionStatusBarItem {"""
new = """export interface ContributionActivityProvider {\n  id: string;\n  events?: string[];\n  handler: string;\n}\n\n/** A plugin that can propose Journal/worklog entries. */\nexport interface ContributionWorklogProvider {\n  id: string;\n  label: string;\n  handler: string;\n}\n\n/** A plugin that contributes normalized signals to the Deal Overview. */\nexport interface ContributionOverviewProvider {\n  id: string;\n  label: string;\n  handler: string;\n}\n\n/** Context passed to every Overview provider command. */\nexport interface OverviewProviderRequest {\n  workspaceRootPath: string;\n}\n\n/**\n * Navigation target for an Overview item. The shell resolves the exact\n * workspace contribution id instead of guessing a tool from a plugin name.\n */\nexport interface OverviewActionTarget {\n  workspaceItemId: string;\n  toolRequest?: Record<string, unknown>;\n}\n\nexport interface OverviewSummaryItem {\n  id: string;\n  label?: string;\n  count: number;\n  detail?: string;\n  /** Lower values are shown first. */\n  order?: number;\n  action?: OverviewActionTarget;\n}\n\nexport interface OverviewSignalItem {\n  id: string;\n  title: string;\n  meta?: string;\n  occurredAt?: string;\n  /** Lower values are shown first when time is not the primary sort key. */\n  order?: number;\n  action?: OverviewActionTarget;\n}\n\nexport interface OverviewRecentItem extends OverviewSignalItem {\n  /** Stable category id used for filtering. */\n  categoryId: string;\n  /** Optional localized label; the shell may fall back to the target tool title. */\n  categoryLabel?: string;\n}\n\n/**\n * Data contract returned by an Overview provider. Providers own their storage\n * and business semantics; the shell owns aggregation, sorting and rendering.\n */\nexport interface OverviewProviderResult {\n  summary?: OverviewSummaryItem[];\n  resume?: OverviewSignalItem[];\n  attention?: OverviewSignalItem[];\n  recent?: OverviewRecentItem[];\n  resources?: OverviewSignalItem[];\n  lastActiveAt?: string;\n}\n\nexport interface ContributionStatusBarItem {"""
assert old in text
text = text.replace(old, new, 1)

old = """  searchProviders?: RegisteredContribution<ContributionSearchProvider>[];\n  activityProviders?: RegisteredContribution<ContributionActivityProvider>[];\n  statusBarItems?: RegisteredContribution<ContributionStatusBarItem>[];"""
new = """  searchProviders?: RegisteredContribution<ContributionSearchProvider>[];\n  activityProviders?: RegisteredContribution<ContributionActivityProvider>[];\n  worklogProviders?: RegisteredContribution<ContributionWorklogProvider>[];\n  overviewProviders?: RegisteredContribution<ContributionOverviewProvider>[];\n  statusBarItems?: RegisteredContribution<ContributionStatusBarItem>[];"""
assert old in text
text = text.replace(old, new, 1)
TYPES.write_text(text)

manifest_path = Path('schemas/manifest.json')
manifest = json.loads(manifest_path.read_text())
contrib_props = manifest['properties']['contributes']['properties']
contrib_props['worklogProviders'] = {
    'type': 'array',
    'items': {'$ref': '#/$defs/ContributionWorklogProvider'},
}
contrib_props['overviewProviders'] = {
    'type': 'array',
    'items': {'$ref': '#/$defs/ContributionOverviewProvider'},
}
provider_def = {
    'type': 'object',
    'properties': {
        'id': {'type': 'string'},
        'label': {'type': 'string'},
        'handler': {'type': 'string'},
    },
    'required': ['id', 'label', 'handler'],
    'additionalProperties': False,
}
manifest['$defs']['ContributionWorklogProvider'] = provider_def
manifest['$defs']['ContributionOverviewProvider'] = provider_def.copy()
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')

registry_path = Path('schemas/contributions.json')
registry = json.loads(registry_path.read_text())
points = registry['contributionPoints']
assert not any(item.get('id') == 'overviewProviders' for item in points)
worklog_index = next(i for i, item in enumerate(points) if item.get('id') == 'worklogProviders')
points.insert(worklog_index + 1, {
    'id': 'overviewProviders',
    'description': 'Plugins that provide normalized summary, resume, attention, recent-change, and resource signals for a Deal Overview.',
    'type': 'provider',
    'status': 'draft',
})
registry_path.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n')
