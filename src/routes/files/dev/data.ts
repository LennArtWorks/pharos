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
    context: `COMPONENT: Button. PROPS: variant ('primary'|'secondary'|'tertiary'|'template'|'unstyled'), size ('xs'|'s'|'sm'|'m'|'l'|'xl'), icon (boolean), active (boolean), disabled (boolean), href (string), class (string). SNIPPETS: children, leading, label, trailing.`.trim()
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
    name: 'Select',
    href: '/files/dev/design-system/ui/select',
    desc: 'Custom popover select supporting rich snippets, icons, and programmatic binding.',
    importStr: `import * as Select from '$lib/components/ui/Select';`,
    context: `
      needs to be written
    `.trim()
  },
  {
    name: 'Popover',
    href: '/files/dev/design-system/ui/popover',
    desc: 'Contextual overlays with automatic viewport positioning and click-outside handling.',
    importStr: `import * as Popover from '$lib/components/ui/Popover';`,
    context: `
      COMPONENT: Form (Svelte 5)
      IMPORT: import Form from '$lib/components/layout/Form.svelte';
      STRUCTURE:
      <Form enhance error={errorMessage} permission="admin.write" class="max-w-[400px]">
        <Input label="Name" bind:value={name} />
        <Button type="submit">Save</Button>
      </Form>
      PROPS:
      - error: string (displays a centered red error message at the bottom)
      - permission: string (broadcasts to all child Inputs to auto-disable them, blocks submit)
      - enhance: boolean | SubmitFunction
      - class: string (used primarily for width/padding/gap styling)
    `.trim()
  }
  // {
  //   name: 'Tag',
  //   href: '/files/dev/design-system/ui/tag',
  //   desc: 'Compact visual indicator based on the secondary button variant.',
  //   importStr: `import Tag from '$lib/components/ui/Tag.svelte';`,
  //   context: `COMPONENT: Tag. PROPS: class. SNIPPETS: children. Used for small labels and statuses.`
  // },
  // {
  //   name: 'Divider',
  //   href: '/files/dev/design-system/ui/divider',
  //   desc: 'Horizontal or vertical visual separator with dynamic thicknesses.',
  //   importStr: `import Divider from '$lib/components/ui/Divider.svelte';`,
  //   context: `COMPONENT: Divider. PROPS: orientation ('horizontal'|'vertical'), class.`
  // }
];

export const blocks: ComponentDef[] = [
  {
    name: 'File',
    href: '/files/dev/design-system/blocks#file',
    desc: 'Visual representation of a file node in the system.',
    importStr: `import File from '$lib/components/blocks/File.svelte';`,
    context: `COMPONENT: File. PROPS: href, filetype, customIcon, dropState, minimized, isEditing, bind:editValue, onsave, oncancel. SNIPPETS: children (main label), nestedItems (for rendering sub-files/folders).`.trim()
  }
];

export const layouts: ComponentDef[] = [
  {
    name: 'Form',
    href: '/files/dev/design-system/layout/form',
    desc: 'A structural wrapper for data submission with progressive enhancement.',
    importStr: `import Form from '$lib/components/layout/Form.svelte';`,
    context: `COMPONENT: Form. PROPS: action (string, e.g. "?/update"), enhance (custom function). Wraps forms for SvelteKit progressive enhancement.`.trim()
  }
  // {
  //   name: 'FloatingNav',
  //   href: '/files/dev/design-system/layout/floating-nav',
  //   desc: 'Sticky sidebar navigation linking to page sections.',
  //   importStr: `import FloatingNav from '$lib/components/layout/FloatingNav.svelte';`,
  //   context: `COMPONENT: FloatingNav. PROPS: sections (NavSection array). Renders sticky side menu.`
  // },
  // {
  //   name: 'Sidebar',
  //   href: '/files/dev/design-system/layout/sidebar',
  //   desc: 'Main application navigation structure.',
  //   importStr: `import Sidebar from '$lib/components/layout/Sidebar.svelte';`,
  //   context: `COMPONENT: Sidebar. App shell navigation layout component.`
  // }
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