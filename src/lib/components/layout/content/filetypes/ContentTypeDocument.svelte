<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Underline from '@tiptap/extension-underline';
	import Link from '@tiptap/extension-link';
	import BubbleMenu from '@tiptap/extension-bubble-menu';
	import { page } from '$app/state';

	import * as Y from 'yjs';
	import { HocuspocusProvider } from '@hocuspocus/provider';
	import Collaboration from '@tiptap/extension-collaboration';
	import CollaborationCaret from '@tiptap/extension-collaboration-caret';

	import type { FSRNode } from '$lib/config/filesystem';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	import { can } from '$lib/utils/permissions';
	import { PERMISSIONS } from '$lib/config/permissions';

	let { node }: { node: FSRNode } = $props();

	let editorElement: HTMLElement;
	let bubbleMenuElement: HTMLElement;

	// Clean variables
	let ydoc: Y.Doc | null = null;
	let editor: Editor | null = null;
	let provider: HocuspocusProvider | null = null;

	let canEdit = $derived(can(PERMISSIONS.FILES.EDIT));

	let isTextDropdownOpen = $state(false);
	let isListDropdownOpen = $state(false);

	let activeStates = $state({
		bold: false,
		italic: false,
		strike: false,
		underline: false,
		h1: false,
		h2: false,
		h3: false,
		paragraph: false,
		bulletList: false,
		orderedList: false,
		blockquote: false,
		code: false,
		codeBlock: false
	});

	onMount(() => {
		const currentUser = page.data.user;

		console.log('[DEBUG 1] Component Mounted. Starting setup...');
		console.log('[DEBUG 2] Editor Element exists?', !!editorElement);
		console.log('[DEBUG 3] Bubble Menu Element exists?', !!bubbleMenuElement);

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws`;
		console.log('[DEBUG 4] Connecting to WS URL:', wsUrl);

		ydoc = new Y.Doc();

		provider = new HocuspocusProvider({
			url: wsUrl,
			name: node.id,
			document: ydoc
		});

		provider.on('status', ({ status }: { status: string }) => {
			console.log(`[WS STATUS] ${status}`);
		});
		provider.on('synced', () => {
			console.log(`[WS SYNCED] Document is fully synced with server!`);
		});

		console.log('[DEBUG 5] Booting Tiptap Editor...');

		editor = new Editor({
			element: editorElement,
			editable: canEdit,
			extensions: [
				StarterKit.configure({ history: false } as any),
				Underline,
				Link.configure({ openOnClick: false }),

				Collaboration.configure({
					document: ydoc
				}),

				CollaborationCaret.configure({
					provider: provider,
					user: currentUser
				}),

				// Always load it; Tiptap hides it automatically when read-only
				...(bubbleMenuElement
					? [
							BubbleMenu.configure({
								element: bubbleMenuElement,
								tippyOptions: { duration: 150, animation: 'shift-away', zIndex: 50 }
							} as any)
						]
					: [])
			],
			editorProps: {
				attributes: { class: 'focus:outline-none min-h-full pb-32' }
			},
			onTransaction: ({ editor }) => {
				activeStates = {
					bold: editor.isActive('bold'),
					italic: editor.isActive('italic'),
					strike: editor.isActive('strike'),
					underline: editor.isActive('underline'),
					h1: editor.isActive('heading', { level: 1 }),
					h2: editor.isActive('heading', { level: 2 }),
					h3: editor.isActive('heading', { level: 3 }),
					paragraph: editor.isActive('paragraph'),
					bulletList: editor.isActive('bulletList'),
					orderedList: editor.isActive('orderedList'),
					blockquote: editor.isActive('blockquote'),
					code: editor.isActive('code'),
					codeBlock: editor.isActive('codeBlock')
				};
			}
		});

		console.log('[DEBUG 6] Editor Mount Complete! Crash avoided.');
	});

	$effect(() => {
		if (editor && editor.isEditable !== canEdit) {
			editor.setEditable(canEdit);
		}
	});

	onDestroy(() => {
		if (editor) editor.destroy();
		if (provider) provider.destroy();
		if (ydoc) ydoc.destroy();
	});

	function toggle(action: () => void) {
		if (!editor || !canEdit) return;
		action();
		editor.chain().focus().run();
		isTextDropdownOpen = false;
		isListDropdownOpen = false;
	}
</script>

<div class="py-3xl flex h-full w-full justify-center overflow-y-auto">
	<div class="max-w-main-5xl relative w-full">
		<div bind:this={bubbleMenuElement} class="bg-level-1 border-border rounded-m absolute flex items-center gap-1 border p-1 opacity-0 shadow-2xl transition-opacity">
			<div class="relative flex">
				<Button variant="tertiary" size="s" onclick={() => (isTextDropdownOpen = !isTextDropdownOpen)}>
					{#snippet leading()}
						<Icon name="text" />
					{/snippet}
					{#snippet trailing()}
						<Icon name="chevron-down" class="h-3 w-3" />
					{/snippet}
				</Button>
				{#if isTextDropdownOpen}
					<div class="bg-level-1 border-border rounded-m absolute top-full left-0 z-50 mt-1 flex w-40 flex-col gap-1 border p-1 shadow-lg">
						<Button variant="tertiary" size="s" active={activeStates.paragraph} onclick={() => toggle(() => editor?.chain().focus().setParagraph().run())}>
							{#snippet label()}
								<span class="w-full text-left">Body</span>
							{/snippet}
						</Button>
						<Button variant="tertiary" size="s" active={activeStates.h1} onclick={() => toggle(() => editor?.chain().focus().toggleHeading({ level: 1 }).run())}>
							{#snippet label()}
								<span class="w-full text-left font-bold">Heading 1</span>
							{/snippet}
						</Button>
						<Button variant="tertiary" size="s" active={activeStates.h2} onclick={() => toggle(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())}>
							{#snippet label()}
								<span class="w-full text-left font-semibold">Heading 2</span>
							{/snippet}
						</Button>
						<Button variant="tertiary" size="s" active={activeStates.h3} onclick={() => toggle(() => editor?.chain().focus().toggleHeading({ level: 3 }).run())}>
							{#snippet label()}
								<span class="w-full text-left font-medium">Heading 3</span>
							{/snippet}
						</Button>
					</div>
				{/if}
			</div>

			<Button variant="tertiary" size="s" active={activeStates.bold} onclick={() => toggle(() => editor?.chain().focus().toggleBold().run())}>
				{#snippet children()}
					<strong class="font-serif">B</strong>
				{/snippet}
			</Button>
			<Button variant="tertiary" size="s" active={activeStates.italic} onclick={() => toggle(() => editor?.chain().focus().toggleItalic().run())}>
				{#snippet children()}
					<em class="font-serif">I</em>
				{/snippet}
			</Button>
			<Button variant="tertiary" size="s" active={activeStates.strike} onclick={() => toggle(() => editor?.chain().focus().toggleStrike().run())}>
				{#snippet children()}
					<s class="font-serif">S</s>
				{/snippet}
			</Button>
			<Button variant="tertiary" size="s" active={activeStates.underline} onclick={() => toggle(() => editor?.chain().focus().toggleUnderline().run())}>
				{#snippet children()}
					<u class="font-serif">U</u>
				{/snippet}
			</Button>
			<Button
				variant="tertiary"
				size="s"
				onclick={() => {
					const url = window.prompt('URL');
					if (url) toggle(() => editor?.chain().focus().setLink({ href: url }).run());
				}}>
				{#snippet children()}
					<Icon name="link" />
				{/snippet}
			</Button>

			<Button variant="tertiary" size="s" active={activeStates.blockquote} onclick={() => toggle(() => editor?.chain().focus().toggleBlockquote().run())}>
				{#snippet children()}
					<span class="font-serif text-lg leading-none">"</span>
				{/snippet}
			</Button>
			<Button variant="tertiary" size="s" active={activeStates.code} onclick={() => toggle(() => editor?.chain().focus().toggleCode().run())}>
				{#snippet children()}
					<Icon name="code" />
				{/snippet}
			</Button>
			<Button variant="tertiary" size="s" active={activeStates.codeBlock} onclick={() => toggle(() => editor?.chain().focus().toggleCodeBlock().run())}>
				{#snippet children()}
					<Icon name="box" />
				{/snippet}
			</Button>

			<div class="relative flex">
				<Button variant="tertiary" size="s" onclick={() => (isListDropdownOpen = !isListDropdownOpen)} active={activeStates.bulletList || activeStates.orderedList}>
					{#snippet leading()}
						<Icon name="list" />
					{/snippet}
					{#snippet trailing()}
						<Icon name="chevron-down" class="h-3 w-3" />
					{/snippet}
				</Button>

				{#if isListDropdownOpen}
					<div class="bg-level-1 border-border rounded-m absolute top-full left-0 z-50 mt-1 flex w-40 flex-col gap-1 border p-1 shadow-lg">
						<Button variant="tertiary" size="s" active={activeStates.bulletList} onclick={() => toggle(() => editor?.chain().focus().toggleBulletList().run())}>
							{#snippet label()}
								<span class="w-full text-left">Bulleted List</span>
							{/snippet}
						</Button>
						<Button variant="tertiary" size="s" active={activeStates.orderedList} onclick={() => toggle(() => editor?.chain().focus().toggleOrderedList().run())}>
							{#snippet label()}
								<span class="w-full text-left">Numbered List</span>
							{/snippet}
						</Button>
					</div>
				{/if}
			</div>

			<div class="bg-border mx-1 h-5 w-px"></div>
			<Button variant="tertiary" size="s">
				{#snippet children()}
					<strong class="font-mono">$</strong>
				{/snippet}
			</Button>
		</div>

		<div bind:this={editorElement} class="editor-content text-ink-90 text-base leading-relaxed"></div>
	</div>
</div>

<style>
	:global(.editor-content .ProseMirror > * + *) {
		margin-top: 1em;
	}
	:global(.editor-content h1) {
		font-size: 2.25rem;
		font-weight: 700;
		line-height: 1.2;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}
	:global(.editor-content h2) {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.3;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}
	:global(.editor-content h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}
	:global(.editor-content p) {
		margin-bottom: 0.75em;
	}
	:global(.editor-content ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-bottom: 1em;
	}
	:global(.editor-content ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin-bottom: 1em;
	}
	:global(.editor-content blockquote) {
		border-left: 4px solid var(--border, #e5e7eb);
		padding-left: 1rem;
		font-style: italic;
		color: var(--ink-50, #6b7280);
	}
	:global(.tippy-box) {
		background-color: transparent !important;
		border: none !important;
		z-index: 50 !important;
	}

	/* The blinking vertical line */
	:global(.collaboration-carets__caret) {
		border-left: 1px solid #0d0d0d;
		border-right: 1px solid #0d0d0d;
		margin-left: -1px;
		margin-right: -1px;
		pointer-events: none;
		position: relative;
		word-break: normal;
	}

	/* The floating name tag */
	:global(.collaboration-carets__label) {
		border-radius: 3px 3px 3px 0;
		color: #ffffff;
		font-size: 12px;
		font-weight: 600;
		font-style: normal;
		left: -1px;
		line-height: normal;
		padding: 2px 6px;
		position: absolute;
		top: -1.4em;
		user-select: none;
		white-space: nowrap;
	}
</style>
