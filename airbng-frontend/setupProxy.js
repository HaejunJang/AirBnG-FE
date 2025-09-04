const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        "/AirBnG", // 컨텍스트 경로 그대로 프록시
        createProxyMiddleware({
            target: "http://localhost:9000",
            changeOrigin: true,
            logLevel: "debug"
        })
    );
};