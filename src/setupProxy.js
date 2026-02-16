const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      pathRewrite: (path) => `/api${path}`, 
    })
  );

  app.use(
    "/ws",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => `/ws${path}`, 
    })
  );
};
