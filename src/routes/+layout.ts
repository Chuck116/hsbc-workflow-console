/**
 * 根布局加载函数
 * - ssr = false: 全站以纯客户端 SPA 方式渲染（数据层为 Mock，无需服务端）。
 * - prerender = false: 不做预渲染，所有路由交由客户端处理。
 */
export const ssr = false;
export const prerender = false;
