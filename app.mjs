import { readFile, readdir, stat } from 'fs/promises';
import { join, isAbsolute, dirname } from 'path';
import { fileURLToPath } from 'url';
import marked from 'marked';
import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';

const ROOT = dirname(fileURLToPath(import.meta.url));
const NODE_MODULES = join(ROOT, 'node_modules');
const [,, dir = 'slides'] = process.argv;
const SLIDES_DIR = isAbsolute(dir) ? dir : join(process.cwd(), dir);

const app = new Koa();

const router = new Router()
  .get('/slides', list)
  .get('/slides/:slide', compile);

app
  .use(router.routes())
  .use(serve(join(ROOT, 'public'), { index: 'index.html' }))
  .use(serve(join(NODE_MODULES, 'milligram', 'dist')))
  .use(serve(join(NODE_MODULES, 'normalize.css')))
  .use(serve(join(NODE_MODULES, 'alpinejs', 'dist')))
  .listen(parseInt(process.env.PORT || 3000, 10));

/**
 * Respond with available slides.
 * @param {Koa.Context} ctx
 */
async function list(ctx) {
  const slides = await readdir(SLIDES_DIR).catch((error) => {
    console.error(error);
    return [];
  });

  ctx.body = slides.filter((slide) => slide.endsWith('.md'));
}

/**
 * Respond with compiled slide.
 * @param {Koa.Context} ctx
 */
async function compile(ctx) {
  const filepath = join(SLIDES_DIR, ctx.params.slide);
  if (!/^[^\/\\]+\.md$/.test(ctx.params.slide) || !(await fileExists(filepath))) {
    ctx.status = 400;
    return;
  }
  try {
    const content = await readFile(filepath, { encoding: 'utf-8' });
    ctx.body = await markedWrapper(content.toString());
  } catch (error) {
    console.error(error);
    ctx.status = 500;
  }
}

/**
 * Promise wrapper for the "marked" module.
 * @param {string} src
 * @returns {Promise<string>}
 */
function markedWrapper(src) {
  return new Promise((resolve, reject) => {
    return marked(src, (error, result) => {
      return error ? reject(error) : resolve(result);
    });
  });
}

/**
 * Utility to check if a path exists and is a file.
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function fileExists(path) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (error) {}
  return false;
}
