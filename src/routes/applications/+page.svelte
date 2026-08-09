<!--
  个人申请 — 路由薄壳
  ------------------------------------------------------------
  申请中心统一收敛为单一入口：仅展示当前用户发起的申请
  （ApplicationsListView scope="mine"，含草稿与已流转单据）。
  URL 参数 ?status=submitted 可预选筛选（仪表盘入口使用）。
-->
<script lang="ts">
	import ApplicationsListView from '$lib/components/ApplicationsListView.svelte';
</script>

<ApplicationsListView scope="mine" />
