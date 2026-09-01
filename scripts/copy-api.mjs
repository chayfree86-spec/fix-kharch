// Postbuild: copy the PHP backend into dist/api so the built folder is a
// self-contained deployable (the subdomain docroot is .../dist, and the API
// must live at dist/api to be reachable at https://<domain>/api).
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const src = 'api';
const dest = join('dist', 'api');

if (!existsSync(src)) {
  console.error('copy-api: "api" folder not found — skipping.');
  process.exit(0);
}

// Start clean so removed backend files don't linger in dist.
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

cpSync(src, dest, {
  recursive: true,
  // Never copy the runtime session store into the build.
  filter: (path) => !path.includes(`${src}\\.sessions`) && !path.includes(`${src}/.sessions`),
});

console.log('copy-api: api -> dist/api done.');
