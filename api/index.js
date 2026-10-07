// The build bundles server code into a CommonJS file outside the public assets.
let app;
module.exports = (request, response) => {
  try {
    app ??= require('../.server-build/api.cjs').default;
  } catch (error) {
    console.error('API startup failed:', error);
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    const diagnostics = request.url?.split('?')[0] === '/api/health'
      ? { code: error.code || 'SERVER_INITIALIZATION_FAILED', dependency: /^Cannot find module '([^']+)'/.exec(error.message || '')?.[1] }
      : {};
    response.end(JSON.stringify({ error: 'El servidor no pudo iniciarse. Revisa el registro del despliegue.', ...diagnostics }));
    return;
  }
  return app(request, response);
};
