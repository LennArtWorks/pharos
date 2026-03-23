<script module lang="ts">
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
		IconUpload,
		IconMoon,
		IconSun,
		IconLayout,
		IconBlocks,
		IconRulerMeasure,
		IconStar,
		IconIcons,
		IconColorSwatch,
		IconSparkles
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
				'circled-arrow-down': { outline: IconCircleArrowDown, filled: IconCircleArrowDown },
				'circled-arrow-left': { outline: IconCircleArrowLeft, filled: IconCircleArrowLeft }
			}
		},
		{
			topic: 'Interface',
			icons: {
				add: { outline: IconPlus, filled: IconPlus },
				x: { outline: IconX, filled: IconX },
				pencil: { outline: IconPencil, filled: IconPencil },
				settings: { outline: IconSettings, filled: IconSettings },
				edit: { outline: IconAdjustments, filled: IconAdjustments },
				filter: { outline: IconFilter, filled: IconFilter },
				search: { outline: IconZoom, filled: IconZoom },
				trash: { outline: IconTrash, filled: IconTrash },
				bell: { outline: IconBell, filled: IconBell },
				'bell-ring': { outline: IconBellRinging, filled: IconBellRinging },
				copy: { outline: IconCopy, filled: IconCopy },
				dots: { outline: IconDots, filled: IconDots },
				printer: { outline: IconPrinter, filled: IconPrinter },
				checkbox: { outline: IconCheckbox, filled: IconCheckbox },
				pin: { outline: IconPin, filled: IconPin }
			}
		},
		{
			topic: 'Files & Storage',
			icons: {
				file: { outline: IconFile, filled: IconFile },
				'file-stats': { outline: IconFileAnalytics, filled: IconFileAnalytics },
				'file-code': { outline: IconFileCode, filled: IconFileCode },
				'file-math': { outline: IconFileDiff, filled: IconFileDiff },
				'file-finance': { outline: IconFileEuro, filled: IconFileEuro },
				'file-table': { outline: IconFileSpreadsheet, filled: IconFileSpreadsheet },
				'settings-file': { outline: IconFileSettings, filled: IconFileSettings },
				folder: { outline: IconFolder, filled: IconFolder },
				'folder-open': { outline: IconFolderOpen, filled: IconFolderOpen },
				upload: { outline: IconUpload, filled: IconUpload },
				download: { outline: IconProgressDown, filled: IconProgressDown },
				'paper-clip': { outline: IconPaperclip, filled: IconPaperclip }
			}
		},
		{
			topic: 'Content & Typography',
			icons: {
				list: { outline: IconList, filled: IconList },
				'list-ordered': { outline: IconListNumbers, filled: IconListNumbers },
				'list-unordered': { outline: IconListLetters, filled: IconListLetters },
				'text-body': { outline: IconTextSize, filled: IconTextSize },
				'text-title': { outline: IconHeading, filled: IconHeading },
				'text-bold': { outline: IconBold, filled: IconBold },
				'text-underline': { outline: IconUnderline, filled: IconUnderline },
				'text-italic': { outline: IconItalic, filled: IconItalic },
				'text-strikethrough': { outline: IconStrikethrough, filled: IconStrikethrough },
				'text-quote': { outline: IconQuote, filled: IconQuote },
				'code-inline': { outline: IconCode, filled: IconCode },
				'code-block': { outline: IconSourceCode, filled: IconSourceCode },
				link: { outline: IconLink, filled: IconLink },
				table: { outline: IconTable, filled: IconTable }
			}
		},
		{
			topic: 'Layout & Structure',
			icons: {
				layout: { outline: IconLayout, filled: IconLayout },
				'layout-boxes': { outline: IconLayoutGrid, filled: IconLayoutGrid },
				'layout-kanban': { outline: IconLayoutKanban, filled: IconLayoutKanban },
				blocks: { outline: IconBlocks, filled: IconBlocks },
				'sidebar-open': { outline: IconLayoutSidebarLeftExpand, filled: IconLayoutSidebarLeftExpand },
				'sidebar-close': { outline: IconLayoutSidebarLeftCollapse, filled: IconLayoutSidebarLeftCollapse },
				collapse: { outline: IconViewportNarrow, filled: IconViewportNarrow },
				shapes: { outline: IconIcons, filled: IconIcons },
				ruler: { outline: IconRulerMeasure, filled: IconRulerMeasure },
				colors: { outline: IconColorSwatch, filled: IconColorSwatch }
			}
		},
		{
			topic: 'User & Security',
			icons: {
				person: { outline: IconUser, filled: IconUser },
				people: { outline: IconUsers, filled: IconUsers },
				'settings-user': { outline: IconUserCog, filled: IconUserCog },
				eye: { outline: IconEye, filled: IconEye },
				'eye-closed': { outline: IconEyeClosed, filled: IconEyeClosed },
				key: { outline: IconKey, filled: IconKey }
			}
		},
		{
			topic: 'Status & Feedback',
			icons: {
				'circled-check': { outline: IconCircleCheck, filled: IconCircleCheck },
				'circled-x': { outline: IconCircleX, filled: IconCircleX },
				'circled-alert': { outline: IconAlertCircle, filled: IconAlertCircle },
				'circled-question': { outline: IconHelp, filled: IconHelp },
				'circled-question-small': { outline: IconHelpCircle, filled: IconHelpCircle },
				star: { outline: IconStar, filled: IconStar }
			}
		},
		{
			topic: 'Environment & Objects',
			icons: {
				home: { outline: IconHome, filled: IconHomeFilled },
				sun: { outline: IconSun, filled: IconSun },
				moon: { outline: IconMoon, filled: IconMoon },
				web: { outline: IconWorld, filled: IconWorld },
				'web-upload': { outline: IconWorldShare, filled: IconWorldShare },
				share: { outline: IconShare, filled: IconShare },
				mail: { outline: IconMail, filled: IconMail },
				'open-website': { outline: IconBrowserMaximize, filled: IconBrowserMaximize },
				castle: { outline: IconTower, filled: IconTower },
				buildings: { outline: IconBuildingCommunity, filled: IconBuildingCommunity },
				'building-adjust': { outline: IconBuildingCog, filled: IconBuildingCog },
				rocket: { outline: IconRocket, filled: IconRocket },
				clock: { outline: IconClock, filled: IconClock },
				dollar: { outline: IconCurrencyDollar, filled: IconCurrencyDollar },
				calendar: { outline: IconCalendarWeek, filled: IconCalendarWeek },
				'calendar-close': { outline: IconCalendarOff, filled: IconCalendarOff },
				'calendar-event': { outline: IconCalendarEvent, filled: IconCalendarEvent },
				sparkles: { outline: IconSparkles, filled: IconSparkles }
			}
		}
	] as const;

	export const iconMap = iconGroups.reduce((acc, group) => ({ ...acc, ...group.icons }), {} as Record<string, any>);

	export type FigmaIconName = keyof typeof iconMap;
</script>

<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import type Sparkles from '@tabler/icons-svelte/icons/sparkles';

	interface Props extends Omit<SVGAttributes<SVGElement>, 'stroke'> {
		name: FigmaIconName;
		filled?: boolean;
		stroke?: number | string;
		class?: string;
	}

	let { name, filled = false, stroke = 1.7, class: className = '', ...rest }: Props = $props();

	const iconEntry = $derived(iconMap[name]);

	const SelectedIcon = $derived.by(() => {
		if (!iconEntry) {
			console.warn(`[Icon] Icon "${name}" not found.`);
			return IconAlertCircle;
		}
		return filled ? iconEntry.filled : iconEntry.outline;
	});

	let hasSize = $derived(/\b(h-|w-|size-)/.test(className));
	let isMissing = $derived(!iconMap[name]);
</script>

<SelectedIcon {stroke} {...rest} class="{hasSize ? '' : 'h-main-xs'} {isMissing ? 'text-red-500' : 'text-current'} {className}" />
