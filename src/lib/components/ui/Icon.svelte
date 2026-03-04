<script module lang="ts">
	/**
	 * import Icon from '$lib/components/ui/Icon.svelte';
	 *
	 * <Icon name="arrow-left" class="size-xl" filled/>
	 */

	import {
		IconSettings,
		IconSettingsFilled,
		IconHome,
		IconHomeFilled,
		IconChevronLeft,
		IconChevronRight,
		IconChevronUp,
		IconChevronDown,
		IconEye,
		IconEyeClosed,
		IconCircleArrowDown,
		IconCircleArrowLeft,
		IconCircleCheck,
		IconCircleX,
		IconPlus,
		IconPencil,
		IconAdjustments,
		IconFilter,
		IconX,
		IconList,
		IconListNumbers,
		IconListLetters,
		IconLayoutSidebarLeftExpand,
		IconLayoutSidebarLeftCollapse,
		IconPrinter,
		IconAlertCircle,
		IconLayoutGrid,
		IconPin,
		IconPaperclip,
		IconZoom,
		IconProgressDown,
		IconRocket,
		IconTower,
		IconBuildingCog,
		IconBuildingCommunity,
		IconUsers,
		IconUser,
		IconTrash,
		IconHelpCircle,
		IconHelp,
		IconBell,
		IconBellRinging,
		IconCalendarWeek,
		IconCalendarOff,
		IconCalendarEvent,
		IconFile,
		IconFileAnalytics,
		IconFileCode,
		IconFileDiff,
		IconFileEuro,
		IconFileSpreadsheet,
		IconFolder,
		IconFolderOpen,
		IconLayoutKanban,
		IconCheckbox,
		IconTable,
		IconMail,
		IconBrowserMaximize,
		IconShare,
		IconWorld,
		IconWorldShare,
		IconTextSize,
		IconBold,
		IconUnderline,
		IconItalic,
		IconStrikethrough,
		IconQuote,
		IconHeading,
		IconViewportNarrow,
		IconCode,
		IconSourceCode,
		IconLink,
		IconKey,
		IconUserCog,
		IconCopy,
		IconDots,
		IconClock,
		IconCurrencyDollar,
		IconUpload
	} from '@tabler/icons-svelte';

	import IconArrowFilledUp from './custom-icons/IconArrowFilledUp.svelte';
	import IconArrowFilledDown from './custom-icons/IconArrowFilledDown.svelte';
	import IconFileSettings from './custom-icons/IconFileSettings.svelte';

	export const iconGroups = [
		{
			topic: 'Navigation',
			icons: {
				'arrow-left': { outline: IconChevronLeft, filled: IconChevronLeft },
				'arrow-right': { outline: IconChevronRight, filled: IconChevronRight },
				'arrow-up': { outline: IconChevronUp, filled: IconChevronUp },
				'arrow-down': { outline: IconChevronDown, filled: IconChevronDown },
				'arrow-up-s': { outline: IconArrowFilledUp, filled: IconArrowFilledUp },
				'arrow-down-s': { outline: IconArrowFilledDown, filled: IconArrowFilledDown },
				'circled-arrow-down': { outline: IconCircleArrowLeft, filled: IconCircleArrowLeft },
				'circled-arrow-left': { outline: IconCircleArrowDown, filled: IconCircleArrowDown }
			}
		},
		{
			topic: 'Rest',
			icons: {
				eye: { outline: IconEye, filled: IconEye },
				'eye-closed': { outline: IconEyeClosed, filled: IconEyeClosed },

				home: { outline: IconHome, filled: IconHomeFilled },
				add: { outline: IconPlus, filled: IconPlus },
				x: { outline: IconX, filled: IconX },

				pencil: { outline: IconPencil, filled: IconPencil },
				settings: { outline: IconSettings, filled: IconSettings },
				edit: { outline: IconAdjustments, filled: IconAdjustments },
				'settings-user': { outline: IconUserCog, filled: IconUserCog },
				// *todo* to fix
				'settings-file': { outline: IconFileSettings, filled: IconFileSettings },

				filter: { outline: IconFilter, filled: IconFilter },
				'circled-check': { outline: IconCircleCheck, filled: IconCircleCheck },
				'circled-x': { outline: IconCircleX, filled: IconCircleX },
				list: { outline: IconList, filled: IconList },
				'list-ordered': { outline: IconListNumbers, filled: IconListNumbers },
				'list-unordered': { outline: IconListLetters, filled: IconListLetters },
				'sidebar-open': { outline: IconLayoutSidebarLeftExpand, filled: IconLayoutSidebarLeftExpand },
				'sidebar-close': { outline: IconLayoutSidebarLeftCollapse, filled: IconLayoutSidebarLeftCollapse },
				printer: { outline: IconPrinter, filled: IconPrinter },
				'circled-alert': { outline: IconAlertCircle, filled: IconAlertCircle },
				'circled-question': { outline: IconHelp, filled: IconHelp },
				'circled-question-small': { outline: IconHelpCircle, filled: IconHelpCircle },
				'layout-boxes': { outline: IconLayoutGrid, filled: IconLayoutGrid },
				'layout-kanban': { outline: IconLayoutKanban, filled: IconLayoutKanban },
				pin: { outline: IconPin, filled: IconPin },
				'paper-clip': { outline: IconPaperclip, filled: IconPaperclip },
				search: { outline: IconZoom, filled: IconZoom },
				download: { outline: IconProgressDown, filled: IconProgressDown },
				rocket: { outline: IconRocket, filled: IconRocket },
				castle: { outline: IconTower, filled: IconTower },
				'building-adjust': { outline: IconBuildingCog, filled: IconBuildingCog },
				buildings: { outline: IconBuildingCommunity, filled: IconBuildingCommunity },
				person: { outline: IconUser, filled: IconUser },
				people: { outline: IconUsers, filled: IconUsers },
				trash: { outline: IconTrash, filled: IconTrash },
				bell: { outline: IconBell, filled: IconBell },
				'bell-ring': { outline: IconBellRinging, filled: IconBellRinging },
				calendar: { outline: IconCalendarWeek, filled: IconCalendarWeek },
				'calendar-close': { outline: IconCalendarOff, filled: IconCalendarOff },
				'calendar-event': { outline: IconCalendarEvent, filled: IconCalendarEvent },
				file: { outline: IconFile, filled: IconFile },
				'file-stats': { outline: IconFileAnalytics, filled: IconFileAnalytics },
				'file-code': { outline: IconFileCode, filled: IconFileCode },
				'file-math': { outline: IconFileDiff, filled: IconFileDiff },
				'file-finance': { outline: IconFileEuro, filled: IconFileEuro },
				'file-table': { outline: IconFileSpreadsheet, filled: IconFileSpreadsheet },
				folder: { outline: IconFolder, filled: IconFolder },
				'folder-open': { outline: IconFolderOpen, filled: IconFolderOpen },
				table: { outline: IconTable, filled: IconTable },
				mail: { outline: IconMail, filled: IconMail },
				'open-website': { outline: IconBrowserMaximize, filled: IconBrowserMaximize },
				share: { outline: IconShare, filled: IconShare },
				web: { outline: IconWorld, filled: IconWorld },
				'web-upload': { outline: IconWorldShare, filled: IconWorldShare },
				'text-body': { outline: IconTextSize, filled: IconTextSize },
				'text-title': { outline: IconHeading, filled: IconHeading },
				'text-bold': { outline: IconBold, filled: IconBold },
				'text-underline': { outline: IconUnderline, filled: IconUnderline },
				'text-italic': { outline: IconItalic, filled: IconItalic },
				'text-strikethrough': { outline: IconStrikethrough, filled: IconStrikethrough },
				'text-quote': { outline: IconQuote, filled: IconQuote },
				collapse: { outline: IconViewportNarrow, filled: IconViewportNarrow },
				'code-inline': { outline: IconCode, filled: IconCode },
				'code-block': { outline: IconSourceCode, filled: IconSourceCode },
				link: { outline: IconLink, filled: IconLink },
				key: { outline: IconKey, filled: IconKey },
				copy: { outline: IconCopy, filled: IconCopy },
				dots: { outline: IconDots, filled: IconDots },
				clock: { outline: IconClock, filled: IconClock },
				dollar: { outline: IconCurrencyDollar, filled: IconCurrencyDollar },
				upload: { outline: IconUpload, filled: IconUpload },
				checkbox: { outline: IconCheckbox, filled: IconCheckbox }
			}
		}
	] as const;

	// 2. Automatically flatten the icons for the component to use
	export const iconMap = iconGroups.reduce(
		(acc, group) => {
			return { ...acc, ...group.icons };
		},
		{} as Record<string, any>
	);

	export type FigmaIconName = keyof typeof iconMap;
</script>

<script lang="ts">
	let {
		name,
		filled = false,
		stroke = 2,
		class: className = ''
	}: {
		name: FigmaIconName;
		filled?: boolean;
		stroke?: number | string;
		class?: string;
	} = $props();

	// 1. Identify if the icon exists, otherwise use a fallback
	const iconEntry = $derived(iconMap[name]);

	// 2. Determine the component constructor.
	// We use a Capitalized variable name so Svelte knows it's a component.
	const SelectedIcon = $derived.by(() => {
		if (!iconEntry) {
			console.warn(`[Icon] Icon "${name}" not found.`);
			return IconAlertCircle;
		}
		return filled ? iconEntry.filled : iconEntry.outline;
	});

	// Checks if className contains "h-", "w-", or "size-" (the \b ensures it's the start of a word, so things like "shadow-md" don't trigger a false positive on the 'w')
	let hasSize = $derived(/\b(h-|w-|size-)/.test(className));
	let isMissing = $derived(!iconMap[name]);
</script>

<SelectedIcon {stroke} class="{hasSize ? '' : 'h-main-xs'} {isMissing ? 'text-red-500' : 'text-current'} {className}" />
