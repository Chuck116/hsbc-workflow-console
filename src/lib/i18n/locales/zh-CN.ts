/**
 * 中文（zh-CN）词条
 * ------------------------------------------------------------
 * 约定：
 * 1. 这是"源语言"文件，`Messages` 类型由它推导，en-US 必须严格对齐；
 * 2. 键名即代码中的引用路径，如 t('dashboard.pending')；
 * 3. 插值使用 {name} 语法，如 t('common.total', { n: 12 })；
 * 4. Schema 驱动的动态表单字段 label 也存 i18n key（如 'fields.destPlace'），
 *    查找失败时 i18n 会原样返回键本身，因此自定义类型的"原文文本"同样兼容。
 */
const zh = {
	common: {
		reset: '重置',
		all: '全部',
		confirm: '确认',
		cancel: '取消',
		delete: '删除',
		view: '查看',
		actions: '操作',
		back: '返回',
		loading: '加载中…',
		close: '关闭',
		total: '共 {n} 条',
		prevPage: '上一页',
		nextPage: '下一页',
		selectAll: '全选',
		pageSize: '{n} 条/页',
		pageSizeLabel: '每页显示条数',
		jumpTo: '跳至',
		pageUnit: '页',
		empty: '暂无数据'
	},
	/** 当前登录用户（Mock） */
	user: {
		name: '沈亦清',
		dept: '运营与合规'
	},
	/** 顶栏角色切换 */
	roleSwitch: {
		label: '当前角色',
		applicant: '申请人',
		approver: '审批人'
	},
	/** 品牌标语：顶栏左侧常驻 */
	brand: {
		slogan: '携手同行，共创繁荣'
	},
	nav: {
		dashboard: '首页',
		settings: '设置',
		collapse: '收起侧栏',
		expand: '展开侧栏',
		menu: '打开菜单',
		center: '差旅管理',
		mine: '差旅申请',
		approvals: '审批中心',
		approvalsPending: '待我审批',
		approvalsDone: '已处理'
	},
	/** 工作流状态 */
	status: {
		draft: '草稿',
		submitted: '待审批',
		approved: '已批准',
		rejected: '已驳回'
	},
	/** 流程时间线事件 */
	timeline: {
		created: '创建申请',
		submitted: '提交审批',
		approved: '审批通过',
		rejected: '审批驳回',
		resubmitted: '重新提交',
		edited: '修改内容',
		waiting: '待审批'
	},
	/** 部门（人员 Mock 数据使用） */
	dept: {
		ops: '运营部',
		fin: '财务部',
		hr: '人力资源部',
		it: '信息技术部',
		mkt: '市场部'
	},
	/** 申请人信息区块 */
	applicant: {
		title: '申请人信息',
		email: '企业邮箱',
		submittedAt: '提交时间',
		createdAt: '创建时间'
	},
	/** 预置申请类型 */
	types: {
		travel: { name: '差旅申请', desc: '出差行程、交通方式与预算申报' }
	},
	/** 预置类型的字段名（Schema 中字段的 label 引用这里的 key） */
	fields: {
		applicantName: '申请人姓名',
		applicantNo: '工号',
		deptName: '所属部门',
		post: '岗位',
		applyTime: '申请提交时间',
		phone: '联系电话',
		attachment: '附件',
		travelReason: '出差事由',
		title: '申请标题',
		travelType: '差旅类型',
		travelScope: '国内 / 国际差旅',
		costCenter: '成本中心',
		currency: '结算币种',
		projectCode: '项目 / WBS 编号',
		departPlace: '出发地',
		destPlace: '目的地',
		travelStart: '出差开始时间',
		travelEnd: '出差结束时间',
		travelDays: '出差天数',
		peerUser: '同行人员',
		trafficMode: '交通方式',
		estimateBudget: '预估总预算',
		isAdvance: '是否预借差旅费',
		advanceAmount: '预借金额',
		approvalStatus: '审批状态'
	},
	/** 下拉选项文案 */
	options: {
		plane: '飞机',
		train: '高铁 / 火车',
		car: '自驾',
		other: '其他',
		yes: '是',
		no: '否',
		customerVisit: '客户拜访',
		internalMeeting: '内部会议',
		projectDelivery: '项目交付驻场',
		training: '培训与发展',
		auditCompliance: '审计与合规检查',
		conference: '行业会议展会',
		scopeDomestic: '国内差旅',
		scopeInternational: '国际差旅'
	},
	/** 表单校验提示 */
	validation: {
		required: '此字段为必填项',
		number: '请输入有效数字',
		min: '不能小于 {min}',
		max: '不能大于 {max}',
		dateAfter: '结束时间不能早于开始时间'
	},
	/** 文件上传 */
	upload: {
		drop: '点击或拖拽文件到此处上传',
		hint: '单个文件不超过 10MB，最多 {n} 个',
		tooLarge: '“{name}”超过 10MB，未上传',
		tooMany: '最多上传 {n} 个文件',
		remove: '移除'
	},
	dashboard: {
		pending: '待审批申请',
		pendingDesc: '需要审批人尽快处理',
		review: '去处理',
		monthTotal: '本月新增',
		monthTotalDesc: '本月创建的申请总数',
		approvalRate: '批准率',
		approvalRateDesc: '已办结申请中获批占比',
		draftCount: '草稿箱',
		draftCountDesc: '尚未提交的草稿',
		trendTitle: '近 30 天申请趋势',
		statusTitle: '状态分布',
		typeTitle: '出行方式分布',
		recent: '最近申请',
		viewAll: '查看全部',
		noData: '暂无数据'
	},
	/** 列表内统计预览 */
	stats: {
		resultCount: '共 {n} 条申请',
		statusDist: '审批状态',
		empty: '该时间范围内暂无申请',
		emptyHint: '试试扩大时间范围，或发起一条新申请'
	},
	applications: {
		new: '发起差旅申请',
		searchPlaceholder: '搜索单号 / 标题 / 申请人 / 出发地 / 目的地…',
		viewSwitch: '视图切换',
		listView: '申请列表',
		statsPreview: '统计预览',
		filterStatus: '状态',
		colId: '申请单号',
		colTitle: '标题',
		colApplicant: '申请人',
		colDept: '部门',
		colDepart: '出发地',
		colDest: '目的地',
		colCreated: '创建时间',
		colStatus: '状态',
		emptyTitle: '没有匹配的申请',
		emptyDesc: '尝试调整筛选条件，或发起一条新申请',
		emptyCta: '发起申请',
		selectedCount: '已选 {n} 项',
		batchSubmit: '批量提交',
		batchDelete: '批量删除',
		clearSelection: '取消选择',
		noDraftSelected: '选中项中没有可提交的草稿',
		deleteTitle: '删除申请',
		deleteConfirm: '将删除选中的 {n} 条草稿，删除后不可恢复，确认删除？',
		quickApproveTitle: '批准申请',
		quickRejectTitle: '驳回申请',
		quickApproveConfirm: '确认批准申请',
		quickRejectConfirm: '驳回后申请人需修改内容并重新提交，确认驳回申请',
		reason: '驳回原因',
		reasonRequired: '请填写驳回原因',
		commentOptional: '审批意见（选填）',
		detail: {
			notFound: '申请不存在',
			notFoundDesc: '该申请可能已被移除，或链接有误',
			backToList: '返回列表',
			content: '申请内容',
			workflow: '审批流程',
			timelineTitle: '流程记录',
			approve: '批准',
			reject: '驳回',
			approveTitle: '批准该申请',
			rejectTitle: '驳回该申请',
			approveConfirm: '确认批准该申请？并行会签下，全部审批人批准后流程才结束。',
			rejectConfirm: '驳回后申请人需修改内容并重新提交，请填写驳回原因。',
			comment: '审批意见（选填）',
			commentPlaceholder: '补充说明你的决定…',
			reason: '驳回原因',
			reasonRequired: '请填写驳回原因',
			edit: '修改申请',
			saveChanges: '保存修改',
			resubmit: '重新提交',
			submitNow: '提交审批',
			approvedBanner: '该申请已批准，流程结束',
			rejectedBanner: '该申请已被驳回，可修改内容后重新提交',
			draftBanner: '草稿尚未提交，可继续编辑并提交'
		}
	},
	newApp: {
		saveDraft: '存为草稿',
		preview: '存草稿并预览',
		draftSuccess: '草稿已保存',
		approvalChain: '审批流程'
	},
	settings: {
		language: '界面语言',
		languageDesc: '切换后即时生效，并在本机记忆',
		zhName: '简体中文',
		enName: 'English',
		data: '演示数据',
		dataDesc: '将差旅申请记录恢复为初始演示数据',
		resetData: '重置演示数据',
		resetDone: '已恢复初始数据',
		about: '关于',
		aboutDesc: 'HSBC Universal Workflow Console · SvelteKit · TypeScript · TailwindCSS · ECharts'
	},
	toast: {
		approved: '已批准该申请',
		approvedAdvanced: '已批准，等待其他审批人处理',
		rejected: '已驳回该申请',
		resubmitted: '已重新提交审批',
		saved: '修改已保存',
		deleted: '已删除 {n} 条草稿',
		deleteBlocked: '仅草稿状态的申请可以删除',
		batchSubmitted: '已提交 {n} 条草稿'
	},
	/** 并行会签审批 */
	approval: {
		progress: '已批准 {done}/{total}',
		approved: '已批准',
		waiting: '待审批',
		rejected: '已驳回',
		idle: '未开始',
		you: '你',
		waitingYou: '该申请正等待你的审批',
		youApproved: '你已批准该申请，等待其他审批人处理',
		notYourApproval: '你不是该申请的审批人，仅可查看',
		awaitingHint: '并行审批中，全部批准即通过',
		parallelHint: '所有审批人可同时审批（无先后顺序），全部批准后申请通过',
		addApprover: '添加审批人',
		addPanelHint: '按工号、姓名或邮箱搜索，或直接从名单中选择',
		add: '添加',
		added: '已添加',
		collapse: '收起',
		remove: '移除该审批人',
		searchPlaceholder: '按工号、姓名或邮箱搜索人员以添加审批人…',
		noMatch: '未找到匹配的人员',
		inChain: '已在审批名单中'
	},
	/** 审批中心（审批人视角的列表页） */
	approvals: {
		emptyPendingTitle: '暂无待办审批',
		emptyPendingDesc: '审批链上没有等待你的申请，稍后再来看看',
		emptyDoneTitle: '还没有处理记录',
		emptyDoneDesc: '你批准或驳回过的申请会出现在这里'
	},
	/** 审批人角色 */
	role: {
		manager: '部门负责人',
		compliance: '合规审批',
		added: '加签审批'
	},
	/** 顶栏消息播报 */
	notifications: {
		title: '消息中心',
		goReview: '去处理',
		pendingGroup: '待办提醒',
		decisionGroup: '最新进展',
		allClear: '暂无待办，全部处理完毕',
		approvedText: ' 已获批准',
		rejectedText: ' 已被驳回'
	}
};

export default zh;
/** 以中文词条推导的消息结构类型，en-US 必须完整实现 */
export type Messages = typeof zh;
