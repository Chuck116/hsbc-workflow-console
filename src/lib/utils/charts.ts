/**
 * ECharts 图表通用常量与类型
 * ------------------------------------------------------------
 * 仪表盘与列表统计预览共用同一套色板 / 轴样式 / 字体，
 * 保证图表视觉与品牌令牌（炭黑 + 汇丰红）一致。
 * 图表采用按需注册（见 EChart.svelte），option 类型由 ECOption 收窄。
 */
import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption, BarSeriesOption, PieSeriesOption } from 'echarts/charts';
import type {
	GridComponentOption,
	TooltipComponentOption,
	LegendComponentOption
} from 'echarts/components';

/** 本站图表的 option 类型（仅含已注册的系列与组件） */
export type ECOption = ComposeOption<
	| LineSeriesOption
	| BarSeriesOption
	| PieSeriesOption
	| GridComponentOption
	| TooltipComponentOption
	| LegendComponentOption
>;

/** 品牌红：关键强调、驳回系列 */
export const RED = '#DB0011';
/** 达标绿：已批准 */
export const GREEN = '#0E7A3D';
/** 坐标轴文字 */
export const AXIS = '#9ca3af';
/** 网格分割线 */
export const SPLIT = '#eef0f2';
/** 图表字体 */
export const FONT = "'IBM Plex Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif";
