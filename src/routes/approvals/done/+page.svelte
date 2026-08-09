<!--
  已处理 — 路由薄壳
  ------------------------------------------------------------
  审批中心的处理记录：当前用户已投出审批意见的申请
  （ApplicationsListView scope="done-approval"）——
  包括本人已批准、以及本人所在审批链被驳回的单据。
-->
<script lang="ts">
	import ApplicationsListView from '$lib/components/ApplicationsListView.svelte';
</script>

<ApplicationsListView scope="done-approval" />
