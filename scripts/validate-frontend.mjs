import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) =>
  readFileSync(new URL(path, root), 'utf8');

const requiredFiles = [
  'index.html',
  'assets/oracle-assets.js',
  'assets/oracle-auth.js',
  'assets/oracle-data.js',
  'assets/oracle-sources.js',
  'assets/oracle-projects.js',
  'assets/oracle-bookmarks.js',
  'assets/oracle-conversations.js',
  'assets/oracle-admin.js',
  'assets/oracle-library.js',
  'assets/oracle-i18n.js',
  'assets/oracle-corpus.js',
  'assets/oracle-citations.js',
  'assets/oracle-ai-ux.js',
  'assets/oracle-text-records.js',
  'assets/oracle-workspace.js',
  'assets/oracle-accessibility.js',
  'assets/oracle-navigation.js',
];

const requiredModules = [
  'oracle-data.js',
  'oracle-sources.js',
  'oracle-projects.js',
  'oracle-bookmarks.js',
  'oracle-conversations.js',
  'oracle-admin.js',
  'oracle-library.js',
  'oracle-i18n.js',
  'oracle-corpus.js',
  'oracle-citations.js',
  'oracle-ai-ux.js',
  'oracle-text-records.js',
  'oracle-workspace.js',
  'oracle-accessibility.js',
  'oracle-navigation.js',
];

for (const file of requiredFiles) {
  const url = new URL(file, root);
  if (!existsSync(url)) {
    throw new Error(`Missing required frontend file: ${file}`);
  }

  if (statSync(url).size === 0) {
    throw new Error(`Frontend file is empty: ${file}`);
  }
}

const index = read('index.html');
const assets = read('assets/oracle-assets.js');
const library = read('assets/oracle-library.js');
const admin = read('assets/oracle-admin.js');
const navigation = read('assets/oracle-navigation.js');
const accessibility = read('assets/oracle-accessibility.js');
const citations = read('assets/oracle-citations.js');
const records = read('assets/oracle-text-records.js');
const workspace = read('assets/oracle-workspace.js');
const auth = read('assets/oracle-auth.js');
const sources = read('assets/oracle-sources.js');
const projects = read('assets/oracle-projects.js');
const bookmarks = read('assets/oracle-bookmarks.js');
const conversations = read('assets/oracle-conversations.js');
const corpus = read('assets/oracle-corpus.js');

const assertions = [
  [index, 'id="chat"', 'chat container'],
  [index, '/api/chat', 'chat API contract'],
  [assets, 'window.ORACLE_ASSETS', 'asset registry'],
  ...requiredModules.map((module) => [assets, module, `module loader: ${module}`]),
  [auth, 'createClient', 'Supabase auth client'],
  [sources, 'source_submissions', 'source submissions'],
  [projects, 'research_projects', 'research projects'],
  [bookmarks, 'bookmarks', 'bookmarks'],
  [conversations, 'conversations', 'conversations'],
  [admin, 'is_admin', 'admin permission check'],
  [admin, 'library_items', 'admin Library records'],
  [admin, 'oracle-library', 'Library storage bucket'],
  [corpus, 'CORPUS_ENDPOINT', 'corpus endpoint'],
  [citations, 'get_citation_record', 'citation lookup'],
  [citations, '[[cite:', 'citation marker support'],
  [records, 'oracleTextPages', 'text record API'],
  [workspace, 'research_projects', 'workspace projects'],
  [workspace, 'bookmarks', 'workspace bookmarks'],
  [workspace, 'conversations', 'workspace conversations'],
  [admin, 'review_note', 'curator review notes'],
  [admin, /approve for corpus/i, 'corpus approval guard'],
  [accessibility, 'Skip to research content', 'accessibility skip link'],
  [accessibility, 'aria-modal', 'modal semantics'],
  [accessibility, 'Escape', 'keyboard dismissal'],
  [navigation, 'pageBack', 'back buttons'],
  [navigation, 'e.target === el', 'outside-click close'],
  [library, 'librarySearch', 'Library search'],
  [library, 'libraryFormatFilters', 'Library format filters'],
];

for (const [content, expected, label] of assertions) {
  const matches = expected instanceof RegExp ? expected.test(content) : content.includes(expected);
  if (!matches) {
    throw new Error(`Frontend validation failed: ${label}`);
  }
}

console.log(`Frontend validation passed: ${requiredFiles.length} required files and ${assertions.length} feature checks.`);
