import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import marked from 'marked';
import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';

const ROOT = process.cwd();
const NODE_MODULES = join(ROOT, 'node_modules');
const SLIDES_DIR = join(ROOT, 'slides');

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
  let compiled = null;
  try {
    const content = await readFile(join(SLIDES_DIR, ctx.params.slide), {
      encoding: 'utf-8',
    });
    compiled = await markedWrapper(content.toString());
  } catch (error) {
    console.error(error);
  }

  ctx.body = compiled;
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
