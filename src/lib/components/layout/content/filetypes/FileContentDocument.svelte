<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Underline from '@tiptap/extension-underline';
	import Link from '@tiptap/extension-link';
	import BubbleMenu from '@tiptap/extension-bubble-menu';
	import type { FSRNode } from '$lib/config/filesystem';
	import { GLOBAL_SETTINGS } from '$lib/config/globalSetting';

	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	// Real permissions!
	import { can } from '$lib/utils/permissions';
	import { PERMISSIONS } from '$lib/config/permissions';

	let { node }: { node: FSRNode } = $props();

	let editorElement: HTMLElement;
	let bubbleMenuElement: HTMLElement;
	let editor: Editor | null = $state(null);

	// Derive edit permission reactively
	let canEdit = $derived($can(PERMISSIONS.FILES.EDIT));

	let saveTimeout: ReturnType<typeof setTimeout>;
	let isDirty = $state(false);
	let isSaving = $state(false); // Useful if you want to show a spinner somewhere

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

	// --- 1. PRODUCTION LOAD ---
	async function loadDocumentContent() {
		try {
			const res = await fetch(`/api/filesystem/documents?id=${node.id}`);
			if (res.ok) {
				const payload = await res.json();

				// If we have data and it looks like a Tiptap doc, return it!
				if (payload.data && payload.data.type === 'doc') {
					return payload.data;
				}
			}
		} catch (e) {
			console.error('Failed to load document content:', e);
		}

		// Fallback/Template for empty or brand new files
		return `
      <h2>${node.name}</h2>
      <p>Start writing here...</p>
    `;
	}

	// --- 2. PRODUCTION SAVE ---
	async function saveContent() {
		if (!isDirty || !editor || !canEdit) return;

		isSaving = true;
		isDirty = false; // Optimistically clear the dirty flag
		const jsonContent = editor.getJSON();

		try {
			// Send the JSON to your backend
			await fetch('/api/filesystem/documents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: node.id,
					content: jsonContent
				})
			});
			console.log(`[SAVED] ${node.id} successfully synced to backend.`);
		} catch (e) {
			console.error('Failed to save document:', e);
			isDirty = true; // Revert dirty flag so it tries again
		} finally {
			isSaving = false;
		}
	}

	onMount(async () => {
		// Wait for the content to fetch before booting the editor
		const initialContent = await loadDocumentContent();

		editor = new Editor({
			element: editorElement,
			editable: canEdit, // Locks the editor if they don't have permission
			extensions: [
				StarterKit,
				Underline,
				Link.configure({ openOnClick: false }),
				...(canEdit
					? [
							BubbleMenu.configure({
								element: bubbleMenuElement,
								tippyOptions: { duration: 150, animation: 'shift-away', zIndex: 50 }
							} as any)
						]
					: [])
			],
			content: initialContent,
			editorProps: {
				attributes: { class: 'focus:outline-none min-h-full pb-32' }
			},
			onUpdate: () => {
				if (!canEdit) return;
				isDirty = true;
				clearTimeout(saveTimeout);
				saveTimeout = setTimeout(saveContent, GLOBAL_SETTINGS.FILES.AUTOSAVE_DELAY_MS);
			},
			// FIX: onTransaction fires on EVERY state change (typing, clicking buttons, selecting)
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
	});

	// Watch for permission changes and lock/unlock editor instantly
	$effect(() => {
		if (editor && editor.isEditable !== canEdit) {
			editor.setEditable(canEdit);
		}
	});

	onDestroy(() => {
		clearTimeout(saveTimeout);
		if (isDirty) saveContent();
		if (editor) editor.destroy();
	});

	function toggle(action: () => void) {
		if (!editor || !canEdit) return;
		action();
		// Force UI state update immediately after clicking, just in case
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
	/* Base Editor Styling remains the same */
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
</style>
