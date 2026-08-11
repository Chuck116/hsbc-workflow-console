/**
 * 英文（en-US）词条
 * 结构与 zh-CN 严格对齐（由 Messages 类型约束），新增文案时两边同步维护。
 */
import type { Messages } from './zh-CN';

const en: Messages = {
	common: {
		reset: 'Reset',
		all: 'All',
		confirm: 'Confirm',
		cancel: 'Cancel',
		delete: 'Delete',
		view: 'View',
		actions: 'Actions',
		back: 'Back',
		loading: 'Loading…',
		close: 'Close',
		total: '{n} items in total',
		prevPage: 'Previous page',
		nextPage: 'Next page',
		selectAll: 'Select all',
		pageSize: '{n} / page',
		pageSizeLabel: 'Items per page',
		jumpTo: 'Go to',
		pageUnit: '',
		empty: 'No data'
	},
	user: {
		name: 'Ethan Shen',
		dept: 'Operations & Compliance'
	},
	roleSwitch: {
		label: 'Current role',
		applicant: 'Applicant',
		approver: 'Approver'
	},
	/** Brand tagline: quiet presence on the left of the top bar */
	brand: {
		slogan: 'Together we thrive'
	},
	nav: {
		dashboard: 'Home',
		settings: 'Settings',
		collapse: 'Collapse sidebar',
		expand: 'Expand sidebar',
		menu: 'Open menu',
		center: 'Travel management',
		mine: 'Travel requests',
		approvals: 'Approvals',
		approvalsPending: 'Awaiting my review',
		approvalsDone: 'Handled'
	},
	status: {
		draft: 'Draft',
		submitted: 'Pending',
		approved: 'Approved',
		rejected: 'Rejected'
	},
	timeline: {
		created: 'Application created',
		submitted: 'Submitted for review',
		approved: 'Approved',
		rejected: 'Rejected',
		resubmitted: 'Resubmitted',
		edited: 'Content updated',
		waiting: 'Awaiting review'
	},
	dept: {
		ops: 'Operations',
		fin: 'Finance',
		hr: 'Human Resources',
		it: 'Technology',
		mkt: 'Marketing'
	},
	applicant: {
		title: 'Applicant',
		email: 'Email',
		submittedAt: 'Submitted at',
		createdAt: 'Created at'
	},
	types: {
		travel: { name: 'Business travel', desc: 'Itinerary, transport and budget request' }
	},
	fields: {
		applicantName: 'Applicant name',
		applicantNo: 'Employee ID',
		deptName: 'Department',
		post: 'Position',
		applyTime: 'Submitted at',
		phone: 'Contact phone',
		attachment: 'Attachment',
		travelReason: 'Trip purpose',
		title: 'Request title',
		travelType: 'Trip type',
		travelScope: 'Domestic / international',
		costCenter: 'Cost center',
		currency: 'Currency',
		projectCode: 'Project / WBS code',
		departPlace: 'Departure from',
		destPlace: 'Destination',
		travelStart: 'Trip start',
		travelEnd: 'Trip end',
		travelDays: 'Trip days',
		peerUser: 'Travel companion',
		trafficMode: 'Transport',
		estimateBudget: 'Estimated budget',
		isAdvance: 'Advance requested',
		advanceAmount: 'Advance amount',
		approvalStatus: 'Approval status'
	},
	options: {
		plane: 'Flight',
		train: 'Rail',
		car: 'Self-drive',
		other: 'Other',
		yes: 'Yes',
		no: 'No',
		customerVisit: 'Client visit',
		internalMeeting: 'Internal meeting',
		projectDelivery: 'Project delivery',
		training: 'Training & development',
		auditCompliance: 'Audit & compliance',
		conference: 'Conference & event',
		scopeDomestic: 'Domestic',
		scopeInternational: 'International'
	},
	validation: {
		required: 'This field is required',
		number: 'Enter a valid number',
		min: 'Must be at least {min}',
		max: 'Must be at most {max}',
		dateAfter: 'End time must not be earlier than start time'
	},
	upload: {
		drop: 'Click or drag files here to upload',
		hint: 'Up to 10 MB per file, max {n} files',
		tooLarge: '"{name}" exceeds 10 MB and was skipped',
		tooMany: 'You can upload up to {n} files',
		remove: 'Remove'
	},
	dashboard: {
		pending: 'Awaiting review',
		pendingDesc: 'Needs an approver to act',
		review: 'Review now',
		monthTotal: 'New this month',
		monthTotalDesc: 'Applications created this month',
		approvalRate: 'Approval rate',
		approvalRateDesc: 'Share approved among decided items',
		draftCount: 'Drafts',
		draftCountDesc: 'Not submitted yet',
		trendTitle: 'Applications — last 30 days',
		statusTitle: 'Status distribution',
		typeTitle: 'Travel mode distribution',
		recent: 'Recent applications',
		viewAll: 'View all',
		noData: 'No data'
	},
	/** Stats preview inside the list view */
	stats: {
		resultCount: '{n} applications',
		statusDist: 'Approval status',
		empty: 'No applications in this period',
		emptyHint: 'Try a wider time range, or raise a new application'
	},
	applications: {
		new: 'New travel request',
		searchPlaceholder: 'Search ID / title / applicant / from / to…',
		viewSwitch: 'Switch view',
		listView: 'Request list',
		statsPreview: 'Stats preview',
		filterStatus: 'Status',
		colId: 'Application ID',
		colTitle: 'Title',
		colApplicant: 'Applicant',
		colDept: 'Department',
		colDepart: 'From',
		colDest: 'To',
		colCreated: 'Created',
		colStatus: 'Status',
		emptyTitle: 'No matching applications',
		emptyDesc: 'Adjust the filters, or start a new application',
		emptyCta: 'New application',
		selectedCount: '{n} selected',
		batchSubmit: 'Submit drafts',
		batchDelete: 'Delete drafts',
		clearSelection: 'Clear selection',
		noDraftSelected: 'No submittable drafts in selection',
		deleteTitle: 'Delete application',
		deleteConfirm: '{n} selected draft(s) will be deleted permanently. Continue?',
		quickApproveTitle: 'Approve application',
		quickRejectTitle: 'Reject application',
		quickApproveConfirm: 'Confirm approving application',
		quickRejectConfirm: 'The applicant will need to revise and resubmit. Confirm rejecting application',
		reason: 'Rejection reason',
		reasonRequired: 'Please provide a rejection reason',
		commentOptional: 'Review comment (optional)',
		detail: {
			notFound: 'Application not found',
			notFoundDesc: 'It may have been removed, or the link is incorrect',
			backToList: 'Back to list',
			content: 'Application content',
			workflow: 'Approval flow',
			timelineTitle: 'Activity log',
			approve: 'Approve',
			reject: 'Reject',
			approveTitle: 'Approve this application',
			rejectTitle: 'Reject this application',
			approveConfirm: 'Approve this application? Under parallel review, the flow completes only after every approver approves.',
			rejectConfirm: 'The applicant will need to revise and resubmit. Please provide a rejection reason.',
			comment: 'Review comment (optional)',
			commentPlaceholder: 'Explain your decision…',
			reason: 'Rejection reason',
			reasonRequired: 'Please provide a rejection reason',
			edit: 'Edit application',
			saveChanges: 'Save changes',
			resubmit: 'Resubmit',
			submitNow: 'Submit for review',
			approvedBanner: 'This application has been approved',
			rejectedBanner: 'This application was rejected — edit and resubmit',
			draftBanner: 'This draft has not been submitted yet'
		}
	},
	newApp: {
		saveDraft: 'Save as draft',
		preview: 'Save draft & preview',
		draftSuccess: 'Draft saved',
		approvalChain: 'Approval flow'
	},
	settings: {
		language: 'Interface language',
		languageDesc: 'Applies instantly and is remembered on this device',
		zhName: '简体中文',
		enName: 'English',
		data: 'Demo data',
		dataDesc: 'Restore travel requests to the initial demo dataset',
		resetData: 'Reset demo data',
		resetDone: 'Demo data restored',
		about: 'About',
		aboutDesc: 'HSBC Universal Workflow Console · SvelteKit · TypeScript · TailwindCSS · ECharts'
	},
	toast: {
		approved: 'Application approved',
		approvedAdvanced: 'Approved — waiting for the other approvers',
		rejected: 'Application rejected',
		resubmitted: 'Resubmitted for review',
		saved: 'Changes saved',
		deleted: '{n} draft(s) deleted',
		deleteBlocked: 'Only drafts can be deleted',
		batchSubmitted: '{n} draft(s) submitted'
	},
	approval: {
		progress: 'Approved {done}/{total}',
		approved: 'Approved',
		waiting: 'Awaiting',
		rejected: 'Rejected',
		idle: 'Not started',
		you: 'You',
		waitingYou: 'This application is waiting for your review',
		youApproved: 'You have approved — waiting for the other approvers',
		notYourApproval: 'You are not an approver of this application',
		awaitingHint: 'In parallel review — approved once everyone has approved',
		parallelHint: 'All approvers can review at the same time (no fixed order); the application passes once everyone approves',
		addApprover: 'Add approver',
		addPanelHint: 'Search by employee ID, name, or email, or pick from the list',
		add: 'Add',
		added: 'Added',
		collapse: 'Collapse',
		remove: 'Remove this approver',
		searchPlaceholder: 'Search by employee ID, name, or email to add an approver…',
		noMatch: 'No matching people',
		inChain: 'Already added'
	},
	approvals: {
		emptyPendingTitle: 'Nothing to review',
		emptyPendingDesc: 'No applications are waiting for you right now — check back later',
		emptyDoneTitle: 'No handled records yet',
		emptyDoneDesc: 'Applications you approve or reject will show up here'
	},
	role: {
		manager: 'Dept head',
		compliance: 'Compliance',
		added: 'Added approver'
	},
	notifications: {
		title: 'Notifications',
		goReview: 'Review',
		pendingGroup: 'Awaiting your review',
		decisionGroup: 'Latest updates',
		allClear: 'All caught up — nothing pending',
		approvedText: ' was approved',
		rejectedText: ' was rejected'
	}
};

export default en;
