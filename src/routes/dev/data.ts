// ==========================================
// 1. COMPONENT DATA REGISTRY
// ==========================================

export interface ComponentDef {
  name: string;
  href: string;
  desc: string;
  importStr: string;
  context: string;
}

export const foundations: ComponentDef[] = [
  {
    name: 'Colors',
    href: '/files/dev/design-system/colors',
    desc: "",
    importStr: "",
    context: `
      [FSR-OS COLOR SYSTEM]
      Tailwind Primitives: neutral, accent, purpur, purple, blue, cyan, green, yellow, orange, red, magenta.
      Steps: 50 to 950 (e.g., bg-accent-500, text-red-600).
      Semantic Text/Ink: text-ink-90 (darkest/primary), text-ink-70, text-ink-50 (muted/secondary), text-ink-30, text-ink-10 (lightest/inverted).
      Semantic Backgrounds: bg-level-0 (app background), bg-level-1 (cards/panels), bg-level-2 (elevated/hover states).
      Borders: border-border (standard subtle border).
    `.trim()
  },
  {
    name: 'Icons',
    href: '/files/dev/design-system/icons',
    desc: "",
    importStr: "",
    context: `
      [FSR-OS ICON SYSTEM]
      Import: import Icon from '$lib/components/ui/Icon.svelte';
      Usage: <Icon name="settings" class="h-4 w-4 text-ink-50" />
      Available specific icons: arrow-left, arrow-right, arrow-down, folder, folder-open, file, settings, check, copy, trash, add, pencil, sparkles.
      Do not use arbitrary strings for the name prop.
    `.trim()
  },
  {
    name: 'Typography',
    href: '/files/dev/design-system/typography',
    desc: "",
    importStr: "",
    context: 'Typography scale coming soon.'
  },
  {
    name: 'Spacing',
    href: '/files/dev/design-system/spacing',
    desc: "",
    importStr: "",
    context: 'Spacing context coming soon.'
  },
  {
    name: 'Permissions',
    href: '/files/dev/design-system/permissions',
    desc: "",
    importStr: "",
    context: 'Permissions context coming soon.'
  }
];

export const uiComponents: ComponentDef[] = [
  {
    name: 'Button',
    href: '/files/dev/design-system/ui/button',
    desc: 'Interactive element for actions. Supports icons, active states, and 5 variants.',
    importStr: `import Button from '$lib/components/ui/Button.svelte';`,
    context: `
      COMPONENT: Button (Svelte 5)
      IMPORT: import Button from '$lib/components/ui/Button.svelte';
      PROPS:
      - variant: 'primary' | 'secondary' | 'tertiary' | 'template' | 'unstyled' (default: 'primary')
      - size: 'xs' | 's' | 'sm' | 'm' | 'l' | 'xl' (default: 'm')
      - icon: boolean (set to true for square icon-only buttons to remove horizontal padding)
      - active, disabled: boolean
      - href: string (renders as <a>)
      - goto: string (uses SvelteKit goto for SPA navigation)
      - class: string
      SNIPPETS: leading (left icon), label (or children for main text), trailing (right icon/badge)
    `.trim()
  },
  {
    name: 'Input',
    href: '/files/dev/design-system/ui/input',
    desc: 'Text fields with built-in permission locking, password toggles, and tooltips.',
    importStr: `import Input from '$lib/components/ui/Input.svelte';`,
    context: `
      COMPONENT: Input (Svelte 5)
      IMPORT: import Input from '$lib/components/ui/Input.svelte';
      PROPS:
      - bind:value: string | number | null
      - type: 'text' (default) | 'email' | 'password' | 'number' | 'date' | etc.
      - label: string (renders label text above input)
      - placeholder: string
      - required: boolean (adds red asterisk)
      - error: string (renders error message below and triggers red ring state)
      - tooltip: string (renders hoverable info icon next to label)
      - disabled: boolean
      - readonly: boolean
      - permission: string (if user lacks permission, forces disabled state and shows lock icon)
      - class: string (applied to the outermost wrapper, not the input itself)
      SNIPPETS: 
      - leading (renders icon/content left of the input text)
      - trailing (renders icon/content right of the input text, next to password toggle if present)
      NOTES:
      - The component automatically toggles between password dots and clear text if type="password".
      - Automatically hooks into FORM_PERMISSION_KEY context if wrapped in a Form block.    
    `.trim()
  },
  {
    name: 'MouseTooltip',
    href: '/files/dev/design-system/ui/mousetooltip',
    desc: 'Adds a mouse-following tooltip when hovering an element.',
    importStr: `import MouseTooltip from '$lib/components/ui/MouseTooltip.svelte';`,
    context: `
      COMPONENT: MouseTooltip (Svelte 5)
      IMPORT: import MouseTooltip from '$lib/components/ui/MouseTooltip.svelte';
      USAGE: Place once in the root layout. It automatically binds to any element with a \`data-tooltip="Message"\` attribute across the app and tracks the mouse position. No props required.
    `.trim()
  },
  {
    name: 'Select',
    href: '/files/dev/design-system/ui/select',
    desc: 'Custom popover select supporting rich snippets, icons, and programmatic binding.',
    importStr: `import * as Select from '$lib/components/ui/Select';`,
    context: `
      COMPONENT: Select (Svelte 5 / Bits UI)
      IMPORT: import * as Select from '$lib/components/ui/Select';
      STRUCTURE:
      <Select.Root bind:value={myVar}>
        <Select.Trigger class="w-full">Placeholder/Selected Value</Select.Trigger>
        <Select.Content>
          <Select.Item value="val1">Label 1</Select.Item>
          <Select.Item value="val2">Label 2</Select.Item>
        </Select.Content>
      </Select.Root>
    `.trim()
  },
  {
    name: 'Popover',
    href: '/files/dev/design-system/ui/popover',
    desc: 'Contextual overlays with automatic viewport positioning and click-outside handling.',
    importStr: `import * as Popover from '$lib/components/ui/Popover';`,
    context: `
      COMPONENT: Popover (Svelte 5 / Bits UI)
      IMPORT: import * as Popover from '$lib/components/ui/Popover';
      STRUCTURE:
      <Popover.Root>
        <Popover.Trigger>Click Me</Popover.Trigger>
        <Popover.Content class="w-64 p-4">Popover Content Here</Popover.Content>
      </Popover.Root>
    `.trim()
  },
  {
    name: 'Tag',
    href: '/files/dev/design-system/ui/tag',
    desc: 'Compact visual indicator based on the secondary button variant.',
    importStr: `import Tag from '$lib/components/ui/Tag.svelte';`,
    context: `
      COMPONENT: Tag (Svelte 5)
      IMPORT: import Tag from '$lib/components/ui/Tag.svelte';
      PROPS: Accepts all Button props (class, etc.). Internally renders a secondary 'xs' Button.
      SNIPPETS: children
    `.trim()
  },
  {
    name: 'Divider',
    href: '/files/dev/design-system/ui/divider',
    desc: 'Horizontal or vertical visual separator with dynamic thicknesses.',
    importStr: `import Divider from '$lib/components/ui/Divider.svelte';`,
    context: `
      COMPONENT: Divider (Svelte 5)
      IMPORT: import Divider from '$lib/components/ui/Divider.svelte';
      PROPS:
      - orientation: 'horizontal' | 'vertical' (default: 'horizontal')
      - class: string (use for margin/padding adjustments)
    `.trim()
  }
];

export const blocks: ComponentDef[] = [
  {
    name: 'File',
    href: '/files/dev/design-system/blocks/file',
    desc: 'Visual representation of a file node in the system.',
    importStr: `import File from '$lib/components/blocks/File.svelte';`,
    context: `
      COMPONENT: File (Svelte 5)
      IMPORT: import File from '$lib/components/blocks/File.svelte';
      PROPS:
      - filetype: UIFileIconType | string (determines the default icon)
      - customIcon: FigmaIconName
      - dropState: 'before' | 'after' | 'inside' | null (renders native DnD indicators)
      - mode: 'default' | 'preview'
      - active, template, loading, iconHidden, disabled, hideLabel, minimized, isEditing, isOpen, hasChildren: boolean
      - tags: (string | {label: string, icon?: FigmaIconName})[]
      - assigned: boolean | string (renders a dot indicator)
      - bind:editValue: string
      - href: string
      - onsave, oncancel, onToggle: functions
      SNIPPETS: children (main label), nestedItems (renders collapsible sub-tree if hasChildren is true)
    `.trim()
  }
];

export const layouts: ComponentDef[] = [
  {
    name: 'Form',
    href: '/files/dev/design-system/layout/form',
    desc: 'A structural wrapper for data submission with progressive enhancement.',
    importStr: `import Form from '$lib/components/layout/Form.svelte';`,
    context: `
      COMPONENT: Form (Svelte 5)
      IMPORT: import Form from '$lib/components/layout/Form.svelte';
      STRUCTURE:
      <Form method="POST" action="?/myAction" enhance={true} error={formError} permission="admin.write" class="max-w-100">
        <Input label="Name" bind:value={name} />
        <Button type="submit">Save</Button>
      </Form>
      PROPS:
      - action: string (Server action route)
      - method: 'POST' | 'GET'
      - error: string (displays a centered red error message at the bottom)
      - permission: string (broadcasts to all child Inputs via Context API to auto-disable them, blocks submit)
      - enhance: boolean | SubmitFunction (Hooks into SvelteKit progressive enhancement)
      - class: string
    `.trim()
  },
  {
    name: 'FloatingNav',
    href: '/files/dev/design-system/layout/floating-nav',
    desc: 'Sticky sidebar navigation linking to page sections.',
    importStr: `import FloatingNav from '$lib/components/layout/FloatingNav.svelte';`,
    context: `
      COMPONENT: FloatingNav (Svelte 5)
      IMPORT: import FloatingNav, { type NavSection } from '$lib/components/layout/FloatingNav.svelte';
      PROPS:
      - sections: NavSection[] (Array of objects containing { title?: string, items: { label: string, href?: string, active?: boolean, onclick?: function, level?: 1|2|3 }[] })
      - class: string
      BEHAVIOR: Renders a vertical menu that tracks active states and triggers SvelteKit routing or custom click events.
    `.trim()
  },
  {
    name: 'OverlayRoot',
    href: '/files/dev/design-system/layout/overlay-root',
    desc: 'Global modal and settings manager driven by URL parameters.',
    importStr: `import { openOverlay, closeOverlay } from '$lib/utils/overlay';`,
    context: `
      COMPONENT: Overlay System (Svelte 5)
      USAGE: Do not import OverlayRoot directly. It lives in the layout. Trigger overlays using utility functions.
      IMPORT: import { openOverlay, closeOverlay } from '$lib/utils/overlay';
      TRIGGER: openOverlay('settings-org', optionalId);
      
      TEMPLATE 1: OverlayTemplateStandard
      IMPORT: import OverlayTemplateStandard from '$lib/components/layout/overlays/templates/OverlayTemplateStandard.svelte';
      PROPS: title (string), onclose (function)
      SNIPPETS: children, footer (optional)
      
      TEMPLATE 2: OverlayTemplateSettings
      IMPORT: import OverlayTemplateSettings from '$lib/components/layout/overlays/templates/OverlayTemplateSettings.svelte';
      PROPS: onclose (function)
      SNIPPETS: sidebar, children
    `.trim()
  }
];

// Single unified export for the AI context generator
export const allComponents: ComponentDef[] = [...uiComponents, ...blocks, ...layouts];

// ==========================================
// 2. NAVIGATION GENERATORS
// ==========================================

const mapToNavItems = (items: { name: string; href: string }[], currentPath: string, currentHash = '', exactMatch = false) => {
  return items.map((item) => ({
    label: item.name,
    href: item.href,
    active: exactMatch
      ? currentPath === item.href
      : currentPath.includes(item.href.split('#')[0]) && (!item.href.includes('#') || currentHash === '#' + item.href.split('#')[1]),
    level: 2 as const
  }));
};

export const designSystemNav = (currentPath: string, currentHash: string) => [
  { items: [{ label: 'Back to Dev Portal', href: '/files/dev', active: false, level: 1 as const }] },
  { items: [{ label: 'Overview', href: '/files/dev/design-system', active: currentPath === '/files/dev/design-system', level: 1 as const }] },
  { title: 'Foundations', items: mapToNavItems(foundations, currentPath, currentHash) },
  { title: 'UI Components', items: mapToNavItems(uiComponents, currentPath, currentHash) },
  { title: 'Blocks', items: mapToNavItems(blocks, currentPath, currentHash) },
  { title: 'Layouts', items: mapToNavItems(layouts, currentPath, currentHash) }
];

export const backendNav = (currentPath: string) => [
  { items: [{ label: 'Back to Dev Portal', href: '/files/dev', active: false, level: 1 as const }] },
  { items: [{ label: 'Dashboard', href: '/files/dev/backend', active: currentPath === '/files/dev/backend', level: 1 as const }] },
  {
    title: 'Detail Pages',
    items: [
      { label: 'Organisations', href: '/files/dev/backend/organisations', active: currentPath.includes('/files/dev/backend/organisations'), level: 2 as const },
      { label: 'RAM Cache', href: '/files/dev/backend/cache', active: currentPath.includes('/files/dev/backend/cache'), level: 2 as const }
    ]
  }
];

export const aiDevNav = (currentPath: string) => [
  { items: [{ label: 'Back to Dev Portal', href: '/files/dev', active: false, level: 1 as const }] },
  { items: [{ label: 'Context Hub', href: '/files/dev/aidev', active: currentPath === '/files/dev/aidev', level: 1 as const }] }
];