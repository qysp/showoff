import { promises as fs } from 'fs';
import { join } from 'path';
import marked from 'marked';
import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';

const CWD = CWD;
const SLIDES_DIR = join(CWD, 'slides');

const app = new Koa();

const router = new Router()
  .redirect('/', '/index.html')
  .get('/slides', list)
  .get('/slides/:slide', compile);

app
  .use(router.routes())
  .use(serve(join(CWD, 'public')))
  .use(serve(join(CWD, 'node_modules', 'milligram', 'dist')))
  .use(serve(join(CWD, 'node_modules', 'normalize.css')))
  .use(serve(join(CWD, 'node_modules', 'alpinejs', 'dist')))
  .listen(parseInt(process.env.PORT || 3000, 10));

/**
 * Respond with available slides.
 * @param {Koa.Context} ctx 
 */
async function list(ctx) {
  const slides = await fs.readdir(SLIDES_DIR)
    .catch((error) => {
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
    const content = await fs.readFile(join(SLIDES_DIR, ctx.params.slide));
    compiled = await markedWrapper(content.toString());
  } catch (error) {
    console.error(error);
  }

  ctx.body = compiled;
}

/**
 * 
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
