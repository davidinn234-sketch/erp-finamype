import { applicationDefault } from 'firebase-admin/app';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Publish directly through the Rules API when the CLI's Service Usage
// preflight is unavailable. This does not change IAM roles or enable APIs.
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const backupIndex = args.indexOf('--backup-dir');
if (apply && (backupIndex < 0 || !args[backupIndex + 1])) {
  throw new Error('--apply requires --backup-dir.');
}
const config = JSON.parse(await readFile('firebase.json', 'utf8'));
if (config.firestore.length !== 1) throw new Error('Expected exactly one database configuration.');
const { database, rules } = config.firestore[0];
const project = process.env.FIREBASE_PROJECT_ID || 'mi-erp-nube';
const credential = applicationDefault();
const releaseName = `projects/${project}/releases/cloud.firestore/${database}`;
async function request(resource, method = 'GET', body) {
  const token = await credential.getAccessToken();
  const response = await fetch(`https://firebaserules.googleapis.com/v1/${resource}`, {
    method,
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Rules API ${method} returned HTTP ${response.status}.`);
  return response.json();
}
const previousRelease = await request(releaseName);
if (previousRelease.name !== releaseName) throw new Error('Unexpected release target.');
const previousRuleset = await request(previousRelease.rulesetName);
const attachmentPoint = previousRuleset.attachment_point || previousRuleset.attachmentPoint;
if (!attachmentPoint?.startsWith('firestore.googleapis.com/projects/') ||
    !attachmentPoint.endsWith(`/databases/${database}`)) {
  throw new Error('Cannot verify the existing named database attachment point.');
}
const source = { files: [{ name: path.basename(rules), content: await readFile(rules, 'utf8') }] };
const compilation = await request(`projects/${project}:test`, 'POST', { source });
const errors = (compilation.issues || []).filter(issue => issue.severity === 'ERROR');
if (errors.length) throw new Error(`Rules compilation failed: ${errors.map(issue => issue.description).join('; ')}`);
console.log(JSON.stringify({ mode: apply ? 'apply' : 'audit', project, database, compilationErrors: 0 }, null, 2));
if (apply) {
  const backupDirectory = path.resolve(args[backupIndex + 1]);
  await mkdir(backupDirectory, { recursive: true });
  await writeFile(path.join(backupDirectory, `firestore-rules-before-${Date.now()}.json`),
    JSON.stringify({ previousRelease, previousRuleset }, null, 2), { flag: 'wx' });
  const created = await request(`projects/${project}/rulesets`, 'POST', { source, attachment_point: attachmentPoint });
  await request(releaseName, 'PATCH', { release: { name: releaseName, rulesetName: created.name } });
  const published = await request(releaseName);
  if (published.rulesetName !== created.name) throw new Error('Published release verification failed.');
  const publishedRuleset = await request(published.rulesetName);
  const hash = content => createHash('sha256').update(content).digest('hex');
  if (hash(publishedRuleset.source.files[0].content) !== hash(source.files[0].content)) {
    throw new Error('Published rules content verification failed.');
  }
  console.log('Rules published and verified on the configured named database.');
}
