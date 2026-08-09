<!--
  待我审批 — 路由薄壳
  ------------------------------------------------------------
  审批中心默认入口：列出审批链上等待当前用户决策的申请
  （ApplicationsListView scope="pending-approval"），
  行内可直接批准 / 驳回，或点进详情处理。
-->
<script lang="ts">
	import ApplicationsListView from '$lib/components/ApplicationsListView.svelte';
</script>

<ApplicationsListView scope="pending-approval" />
