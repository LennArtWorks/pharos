<script lang="ts">
	import Form from '$lib/components/layout/Form.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { iconGroups, type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import * as Popover from '$lib/components/ui/Popover';
	import * as Select from '$lib/components/ui/Select';
	import { allComponents } from '../../../../data';

	const allIcons = iconGroups.flatMap((g) => Object.keys(g.icons)) as FigmaIconName[];

	const componentData = allComponents.find((c) => c.name === 'Form');
	const aiContext = componentData?.context || 'Context not found.';

	// --- Form Builder Types ---
	type BaseEl = { id: string };
	type TitleEl = BaseEl & { type: 'title'; title: string; subtitle: string };
	type TextBlockEl = BaseEl & { type: 'textblock'; content: string; align: 'left' | 'center' | 'right' };
	type IconEl = BaseEl & { type: 'icon'; iconName: FigmaIconName; size: 'h-4 w-4' | 'h-6 w-6' | 'h-8 w-8' | 'h-12 w-12'; color: string };
	type InputEl = BaseEl & {
		type: 'input';
		label: string;
		placeholder: string;
		inputType: string;
		required: boolean;
		permission: string;
		leadingIcon: FigmaIconName | null;
		trailingIcon: FigmaIconName | null;
	};
	type ButtonEl = BaseEl & {
		type: 'button';
		content: string;
		variant: 'primary' | 'secondary' | 'tertiary';
		isSubmit: boolean;
		leadingIcon: FigmaIconName | null;
		trailingIcon: FigmaIconName | null;
	};
	type FormElement = TitleEl | TextBlockEl | IconEl | InputEl | ButtonEl;

	// --- Sandbox State ---
	let formError = $state('');
	let formPermission = $state('');
	let useEnhance = $state(true);

	// Sizing & Spacing State
	let formWidth = $state(400);
	let formGap = $state(16);
	let padLinked = $state(true);
	let pt = $state(32);
	let pr = $state(32);
	let pb = $state(32);
	let pl = $state(32);

	// Builder Elements State (Strictly initialized with nulls to prevent Svelte 5 bind crashes)
	let elements = $state<FormElement[]>([
		{ id: 'el-1', type: 'title', title: 'Sign In', subtitle: 'Enter your credentials to access the system.' },
		{ id: 'el-2', type: 'input', label: 'Email Address', placeholder: 'name@company.com', inputType: 'email', required: true, permission: '', leadingIcon: 'mail', trailingIcon: null },
		{ id: 'el-3', type: 'input', label: 'Password', placeholder: '', inputType: 'password', required: true, permission: '', leadingIcon: null, trailingIcon: null },
		{ id: 'el-4', type: 'button', content: 'Login', variant: 'primary', isSubmit: true, leadingIcon: null, trailingIcon: null }
	]);

	// --- Drag & Drop State ---
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	// --- Resizer State ---
	let isResizing = $state(false);
	let resizeSide = $state<'left' | 'right' | null>(null);
	let startX = 0;
	let startWidth = 0;

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false);

	let nextId = 5;

	// --- Actions ---
	function updatePadding(val: number, side: 't' | 'r' | 'b' | 'l') {
		if (padLinked) {
			pt = pr = pb = pl = val;
		} else {
			if (side === 't') pt = val;
			if (side === 'r') pr = val;
			if (side === 'b') pb = val;
			if (side === 'l') pl = val;
		}
	}

	function addElement(type: FormElement['type'], index: number) {
		let newEl: FormElement;
		if (type === 'input')
			newEl = { id: `el-${nextId++}`, type: 'input', label: 'New Input', placeholder: '', inputType: 'text', required: false, permission: '', leadingIcon: null, trailingIcon: null };
		else if (type === 'button') newEl = { id: `el-${nextId++}`, type: 'button', content: 'Action', variant: 'secondary', isSubmit: false, leadingIcon: null, trailingIcon: null };
		else if (type === 'textblock') newEl = { id: `el-${nextId++}`, type: 'textblock', content: 'This is a text block.', align: 'left' };
		else if (type === 'icon') newEl = { id: `el-${nextId++}`, type: 'icon', iconName: 'star', size: 'h-8 w-8', color: 'text-ink-90' };
		else newEl = { id: `el-${nextId++}`, type: 'title', title: 'New Section', subtitle: '' };

		const newElements = [...elements];
		newElements.splice(index, 0, newEl);
		elements = newElements;
	}

	function removeElement(id: string) {
		elements = elements.filter((e) => e.id !== id);
	}

	// --- Drag & Drop Handlers ---
	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', index.toString());
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;
		dragOverIndex = index;
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		const newItems = [...elements];
		const [moved] = newItems.splice(draggedIndex, 1);
		newItems.splice(index, 0, moved);
		elements = newItems;

		draggedIndex = null;
		dragOverIndex = null;
	}

	// --- Resizer Handlers ---
	function initResize(e: MouseEvent, side: 'left' | 'right') {
		isResizing = true;
		resizeSide = side;
		startX = e.clientX;
		startWidth = formWidth;
		document.addEventListener('mousemove', doResize);
		document.addEventListener('mouseup', stopResize);
	}

	function doResize(e: MouseEvent) {
		if (!isResizing) return;
		const dx = resizeSide === 'right' ? (e.clientX - startX) * 2 : (startX - e.clientX) * 2;
		formWidth = Math.max(250, Math.min(800, startWidth + dx));
	}

	function stopResize() {
		isResizing = false;
		resizeSide = null;
		document.removeEventListener('mousemove', doResize);
		document.removeEventListener('mouseup', stopResize);
	}

	// --- Code Generation ---
	$effect(() => {
		const currentElements = elements.map((e) => ({ ...e }));
		const currentError = formError;
		const currentPermission = formPermission;
		const currentEnhance = useEnhance;
		const cw = formWidth;
		const cg = formGap;
		const cpt = pt;
		const cpr = pr;
		const cpb = pb;
		const cpl = pl;

		if (isCodeEditorFocused) return;

		let props = [];
		if (currentError) props.push(`error="${currentError}"`);
		if (currentPermission) props.push(`permission="${currentPermission}"`);
		if (currentEnhance) props.push(`enhance`);

		let classStr = `max-w-[${cw}px] gap-[${cg}px]`;
		if (cpt === cpr && cpr === cpb && cpb === cpl) {
			classStr += ` p-[${cpt}px]`;
		} else {
			classStr += ` pt-[${cpt}px] pr-[${cpr}px] pb-[${cpb}px] pl-[${cpl}px]`;
		}
		props.push(`class="${classStr}"`);

		const propsStr = props.length > 0 ? ' ' + props.join(' ') : '';
		// Removed explicit method="POST"
		let code = `<Form${propsStr}>\n`;

		for (const el of currentElements) {
			if (el.type === 'title') {
				code += `  <div class="mb-4">\n`;
				code += `    <h2 class="text-label-l text-ink-90 font-bold">${el.title}</h2>\n`;
				if (el.subtitle) code += `    <p class="text-body-s text-ink-50">${el.subtitle}</p>\n`;
				code += `  </div>\n`;
			} else if (el.type === 'textblock') {
				code += `  <p class="text-body-m text-ink-90 text-${el.align}">${el.content}</p>\n`;
			} else if (el.type === 'icon') {
				code += `  <div class="flex w-full justify-center">\n`;
				code += `    <Icon name="${el.iconName}" class="${el.size} ${el.color}" />\n`;
				code += `  </div>\n`;
			} else if (el.type === 'input') {
				let inProps = [];
				if (el.label) inProps.push(`label="${el.label}"`);
				if (el.inputType !== 'text') inProps.push(`type="${el.inputType}"`);
				if (el.placeholder) inProps.push(`placeholder="${el.placeholder}"`);
				if (el.required) inProps.push(`required`);

				const bindName = el.label ? el.label.toLowerCase().replace(/\s+/g, '') : `val${el.id}`;
				inProps.unshift(`bind:value={${bindName}}`);

				let innerHtml = '';
				if (el.leadingIcon) innerHtml += `    {#snippet leading()}<Icon name="${el.leadingIcon}" />{/snippet}\n`;
				if (el.trailingIcon) innerHtml += `    {#snippet trailing()}<Icon name="${el.trailingIcon}" />{/snippet}\n`;

				if (innerHtml) {
					code += `  <Input ${inProps.join(' ')}>\n${innerHtml}  </Input>\n`;
				} else {
					code += `  <Input ${inProps.join(' ')} />\n`;
				}
			} else if (el.type === 'button') {
				let btnProps = [];
				if (el.variant !== 'primary') btnProps.push(`variant="${el.variant}"`);
				if (el.isSubmit) btnProps.push(`type="submit"`);

				const btnPropsStr = btnProps.length > 0 ? ' ' + btnProps.join(' ') : '';

				let innerHtml = '';
				if (el.leadingIcon) innerHtml += `    {#snippet leading()}<Icon name="${el.leadingIcon}" />{/snippet}\n`;
				if (el.trailingIcon) innerHtml += `    {#snippet trailing()}<Icon name="${el.trailingIcon}" />{/snippet}\n`;

				if (innerHtml) {
					code += `  <Button${btnPropsStr}>\n${innerHtml}    ${el.content}\n  </Button>\n`;
				} else {
					code += `  <Button${btnPropsStr}>${el.content}</Button>\n`;
				}
			}
		}

		code += `</Form>`;
		editableCode = code;
	});

	// --- Live Editor Reverse Parser ---
	function handleCodeInput(e: Event) {
		const code = (e.target as HTMLTextAreaElement).value;
		editableCode = code;

		if (!code.includes('<Form')) return;

		const formMatch = code.match(/<Form([^>]*)>/);
		if (formMatch) {
			const attr = formMatch[1];
			const errMatch = attr.match(/error="([^"]*)"/);
			formError = errMatch ? errMatch[1] : '';
			const permMatch = attr.match(/permission="([^"]*)"/);
			formPermission = permMatch ? permMatch[1] : '';
			useEnhance = /\benhance\b/.test(attr);

			const wMatch = attr.match(/max-w-\[([^\]]+)px\]/);
			if (wMatch) formWidth = parseInt(wMatch[1]) || 400;
			const gapMatch = attr.match(/gap-\[([^\]]+)px\]/);
			if (gapMatch) formGap = parseInt(gapMatch[1]) || 16;

			const pMatch = attr.match(/ p-\[([^\]]+)px\]/);
			if (pMatch) {
				updatePadding(parseInt(pMatch[1]), 't');
				padLinked = true;
			} else {
				padLinked = false;
				const ptMatch = attr.match(/pt-\[([^\]]+)px\]/);
				if (ptMatch) pt = parseInt(ptMatch[1]) || 32;
				const prMatch = attr.match(/pr-\[([^\]]+)px\]/);
				if (prMatch) pr = parseInt(prMatch[1]) || 32;
				const pbMatch = attr.match(/pb-\[([^\]]+)px\]/);
				if (pbMatch) pb = parseInt(pbMatch[1]) || 32;
				const plMatch = attr.match(/pl-\[([^\]]+)px\]/);
				if (plMatch) pl = parseInt(plMatch[1]) || 32;
			}
		}

		const contentMatch = code.match(/<Form[^>]*>([\s\S]*?)<\/Form>/);
		if (contentMatch) {
			const inner = contentMatch[1];
			const elRegex = /<div class="mb-4">[\s\S]*?<h2[^>]*>([^<]*)<\/h2>(?:[\s\S]*?<p[^>]*>([^<]*)<\/p>)?[\s\S]*?<\/div>|<Input([^>]+)\/>|<Button([^>]*)>([^<]*)<\/Button>/g;

			let match;
			const parsedElements: FormElement[] = [];

			while ((match = elRegex.exec(inner)) !== null) {
				if (match[0].startsWith('<div')) {
					parsedElements.push({ id: `el-${Date.now()}-${Math.random()}`, type: 'title', title: match[1] || '', subtitle: match[2] || '' });
				} else if (match[0].startsWith('<Input')) {
					const attr = match[3];
					const labelMatch = attr.match(/label="([^"]*)"/);
					const typeMatch = attr.match(/type="([^"]*)"/);
					const placeMatch = attr.match(/placeholder="([^"]*)"/);
					const reqMatch = /\brequired\b/.test(attr);

					parsedElements.push({
						id: `el-${Date.now()}-${Math.random()}`,
						type: 'input',
						label: labelMatch ? labelMatch[1] : '',
						inputType: typeMatch ? typeMatch[1] : 'text',
						placeholder: placeMatch ? placeMatch[1] : '',
						required: reqMatch,
						permission: '',
						leadingIcon: null,
						trailingIcon: null
					});
				} else if (match[0].startsWith('<Button')) {
					const attr = match[4];
					const content = match[5];
					const varMatch = attr.match(/variant="([^"]*)"/);
					const submitMatch = attr.match(/type="submit"/);
					parsedElements.push({
						id: `el-${Date.now()}-${Math.random()}`,
						type: 'button',
						content: content || 'Button',
						variant: (varMatch ? varMatch[1] : 'primary') as any,
						isSubmit: !!submitMatch,
						leadingIcon: null,
						trailingIcon: null
					});
				}
			}
			if (parsedElements.length > 0) {
				elements = parsedElements.map((p, i) => ({ ...p, id: elements[i] ? elements[i].id : p.id }));
			}
		}
	}

	function resetSandbox() {
		formError = '';
		formPermission = '';
		formWidth = 400;
		formGap = 16;
		padLinked = true;
		pt = pr = pb = pl = 32;
		useEnhance = true;
		elements = [
			{ id: 'el-1', type: 'title', title: 'Sign In', subtitle: 'Enter your credentials to access the system.' },
			{ id: 'el-2', type: 'input', label: 'Email Address', placeholder: 'name@company.com', inputType: 'email', required: true, permission: '', leadingIcon: 'mail', trailingIcon: null },
			{ id: 'el-3', type: 'input', label: 'Password', placeholder: '', inputType: 'password', required: true, permission: '', leadingIcon: null, trailingIcon: null },
			{ id: 'el-4', type: 'button', content: 'Login', variant: 'primary', isSubmit: true, leadingIcon: null, trailingIcon: null }
		];
	}

	async function copyToClipboard(text: string, copyType: 'code' | 'ai') {
		try {
			await navigator.clipboard.writeText(text);
			if (copyType === 'code') copiedCode = true;
			if (copyType === 'ai') copiedAI = true;
			setTimeout(() => {
				copiedCode = false;
				copiedAI = false;
			}, 2000);
		} catch (err) {
			console.error(err);
		}
	}

	function handleDummySubmit(e: Event) {
		e.preventDefault();
		if (!formPermission || formPermission === 'admin') alert('Sandbox Preview: Form submitted!');
		else alert('Submit blocked by permission logic.');
	}
</script>

{#snippet addDivider(index: number)}
	<div
		data-uiname={`add-divider-${index}`}
		class="group/divider relative z-20 flex h-0 w-full items-center justify-center overflow-visible focus-within:z-50 hover:z-50"
		style="margin-top: -{formGap / 2}px; margin-bottom: -{formGap / 2}px;">
		<div class="absolute -top-3 right-0 left-0 flex h-6 items-center justify-center opacity-0 transition-opacity focus-within:opacity-100 hover:opacity-100">
			<div class="bg-accent-500 pointer-events-none absolute right-0 left-0 h-[2px]"></div>
			<Popover.Root closeOnClick={false}>
				<Popover.Trigger>
					<div
						data-uiname={`add-btn-${index}`}
						tabindex="0"
						class="bg-accent-500 text-level-0 relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full shadow-md transition-transform outline-none hover:scale-110">
						<Icon name="add" class="h-4 w-4" />
					</div>
				</Popover.Trigger>
				<Popover.Content class="w-48">
					<span class="text-label-xs text-ink-50 px-2 py-1 font-bold tracking-wider uppercase">Add Component</span>
					<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => addElement('title', index)}><Icon name="text-title" class="mr-2 h-4 w-4" /> Title</Button>
					<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => addElement('textblock', index)}><Icon name="text-body" class="mr-2 h-4 w-4" /> Text Block</Button>
					<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => addElement('input', index)}><Icon name="pencil" class="mr-2 h-4 w-4" /> Input</Button>
					<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => addElement('button', index)}><Icon name="shapes" class="mr-2 h-4 w-4" /> Button</Button>
					<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => addElement('icon', index)}><Icon name="star" class="mr-2 h-4 w-4" /> Icon</Button>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>
{/snippet}

<div data-uiname="sandbox-page-wrapper" class="gap-3xl flex flex-col">
	<header data-uiname="sandbox-header" class="border-border pb-3xl border-b">
		<div data-uiname="header-title-row" class="gap-l mb-l flex items-center">
			<Button data-uiname="back-button" href="/dev/design-system/layout" variant="secondary" size="s" icon data-tooltip="Back to Layouts">
				<Icon data-uiname="back-button-icon" name="arrow-left" />
			</Button>
			<h1 data-uiname="sandbox-title" class="text-label-xl text-ink-90 font-bold">Form Builder</h1>
		</div>
		<p data-uiname="sandbox-description" class="text-body-m text-ink-50 mb-m max-w-2xl">
			A structural wrapper for data submission. Provides SvelteKit progressive enhancement, unified error states, and automatic permission broadcasting down to primitive components.
		</p>
		<Button
			data-uiname="ai-context-button"
			variant="secondary"
			size="s"
			data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'}
			onclick={() => copyToClipboard(aiContext, 'ai')}>
			<Icon data-uiname="ai-context-icon" name="code-block" class="mr-2" /> AI Context
		</Button>
	</header>

	<section data-uiname="sandbox-interactive-area" class="bg-level-1 border-border rounded-m flex flex-col overflow-hidden border">
		<div data-uiname="sandbox-preview-container" class="bg-level-0 border-border relative flex h-auto min-h-[500px] items-center justify-center overflow-visible border-b p-16 pb-32">
			<div data-uiname="form-resizable-container" class="group/container relative flex justify-center" style="width: {formWidth}px">
				<div
					data-uiname="form-resizer-left"
					onmousedown={(e) => initResize(e, 'left')}
					class="absolute top-0 bottom-0 left-[-16px] z-10 flex w-8 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover/container:opacity-100">
					<div class="bg-accent-500/50 hover:bg-accent-500 h-12 w-1 rounded-full transition-colors"></div>
				</div>

				<Form
					data-uiname="preview-form"
					error={formError}
					permission={formPermission}
					enhance={useEnhance}
					onsubmit={handleDummySubmit}
					onclickcapture={(e) => e.preventDefault()}
					class="bg-level-1 border-border relative w-full rounded-xl border shadow-sm transition-all"
					style="gap: {formGap}px; padding: {pt}px {pr}px {pb}px {pl}px;">
					{@render addDivider(0)}

					{#each elements as el, index (el.id)}
						<div
							data-uiname={`form-el-wrapper-${el.id}`}
							role="listitem"
							class="group/item relative z-20 flex w-full cursor-grab items-center rounded-lg focus-within:z-50 hover:z-50"
							draggable="true"
							ondragstart={(e) => handleDragStart(e, index)}
							ondragover={(e) => handleDragOver(e, index)}
							ondrop={(e) => handleDrop(e, index)}
							ondblclick={(e) => {
								(e.currentTarget.querySelector('div[tabindex="0"]') as HTMLElement)?.click();
							}}>
							<div
								class="group-hover/item:border-accent-500/40 pointer-events-none absolute inset-[-6px] z-10 rounded-lg border-2 border-transparent transition-colors {dragOverIndex === index
									? 'border-t-accent-500 border-t-4'
									: ''}">
							</div>

							<div data-uiname={`actions-left-${el.id}`} class="absolute -left-12 z-50 flex flex-col gap-1 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
								<Popover.Root closeOnClick={false}>
									<Popover.Trigger>
										<div
											data-uiname={`edit-btn-${el.id}`}
											data-tooltip="Edit Component"
											tabindex="0"
											class="text-ink-50 hover:bg-level-2 hover:text-ink-90 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors outline-none">
											<Icon name="pencil" class="h-4 w-4" />
										</div>
									</Popover.Trigger>

									<Popover.Content class="w-80 p-4">
										<span class="text-label-s text-ink-90 border-border mb-4 block border-b pb-2 font-bold tracking-wider uppercase">Edit {el.type}</span>

										{#if el.type === 'title'}
											<div class="flex flex-col gap-4">
												<Input bind:value={el.title} label="Title" />
												<Input bind:value={el.subtitle} label="Subtitle" />
											</div>
										{:else if el.type === 'textblock'}
											<div class="flex flex-col gap-4">
												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Content</div>
													<textarea
														bind:value={el.content}
														class="bg-level-1 border-border rounded-m text-body-s text-ink-90 focus:border-accent-500 focus:ring-accent-500 min-h-[100px] w-full resize-y border p-3 outline-none focus:ring-1"
													></textarea>
												</div>
												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Alignment</div>
													<Select.Root bind:value={el.align}>
														<Select.Trigger placeholder="Align" />
														<Select.Content>
															<Select.Item value="left" label="Left" />
															<Select.Item value="center" label="Center" />
															<Select.Item value="right" label="Right" />
														</Select.Content>
													</Select.Root>
												</div>
											</div>
										{:else if el.type === 'icon'}
											<div class="flex flex-col gap-4">
												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Icon</div>
													<Select.Root bind:value={el.iconName}>
														<Select.Trigger placeholder="Select..." />
														<Select.Content class="max-h-[300px] overflow-y-auto">
															{#each allIcons as iconName}
																<Select.Item value={iconName}>
																	<Icon name={iconName} class="mr-2 h-4 w-4" />
																	<span class="truncate">{iconName}</span>
																</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>
												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Size</div>
													<Select.Root bind:value={el.size}>
														<Select.Trigger placeholder="Size" />
														<Select.Content>
															<Select.Item value="h-4 w-4" label="Small (16px)" />
															<Select.Item value="h-6 w-6" label="Medium (24px)" />
															<Select.Item value="h-8 w-8" label="Large (32px)" />
															<Select.Item value="h-12 w-12" label="X-Large (48px)" />
														</Select.Content>
													</Select.Root>
												</div>
												<Input bind:value={el.color} label="Tailwind Text Color" placeholder="e.g. text-error" />
											</div>
										{:else if el.type === 'input'}
											<div class="flex flex-col gap-4">
												<Input bind:value={el.label} label="Label" />
												<Input bind:value={el.placeholder} label="Placeholder" />
												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Input Type</div>
													<Select.Root bind:value={el.inputType}>
														<Select.Trigger placeholder="Type" />
														<Select.Content>
															{#each ['text', 'email', 'password', 'number'] as t}<Select.Item value={t} label={t} />{/each}
														</Select.Content>
													</Select.Root>
												</div>

												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Leading Icon</div>
													<Select.Root bind:value={el.leadingIcon}>
														<Select.Trigger placeholder="None">
															{#if el.leadingIcon}<Icon name={el.leadingIcon} class="mr-2 h-4 w-4" /> {el.leadingIcon}{:else}None{/if}
														</Select.Trigger>
														<Select.Content class="max-h-[200px] overflow-y-auto">
															<Select.Item value={null} label="None" />
															{#each allIcons as iconName}
																<Select.Item value={iconName}><Icon name={iconName} class="mr-2 h-4 w-4" /> {iconName}</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>

												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Trailing Icon</div>
													<Select.Root bind:value={el.trailingIcon}>
														<Select.Trigger placeholder="None">
															{#if el.trailingIcon}<Icon name={el.trailingIcon} class="mr-2 h-4 w-4" /> {el.trailingIcon}{:else}None{/if}
														</Select.Trigger>
														<Select.Content class="max-h-[200px] overflow-y-auto">
															<Select.Item value={null} label="None" />
															{#each allIcons as iconName}
																<Select.Item value={iconName}><Icon name={iconName} class="mr-2 h-4 w-4" /> {iconName}</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>

												<Button size="s" variant={el.required ? 'primary' : 'tertiary'} active={el.required} onclick={() => (el.required = !el.required)}>Required State (*)</Button>
											</div>
										{:else if el.type === 'button'}
											<div class="flex flex-col gap-4">
												<Input bind:value={el.content} label="Button Text" />
												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Variant</div>
													<div class="flex gap-2">
														{#each ['primary', 'secondary', 'tertiary'] as v}
															<Button size="s" variant={el.variant === v ? 'primary' : 'tertiary'} active={el.variant === v} onclick={() => (el.variant = v as any)}>{v}</Button>
														{/each}
													</div>
												</div>

												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Leading Icon</div>
													<Select.Root bind:value={el.leadingIcon}>
														<Select.Trigger placeholder="None">
															{#if el.leadingIcon}<Icon name={el.leadingIcon} class="mr-2 h-4 w-4" /> {el.leadingIcon}{:else}None{/if}
														</Select.Trigger>
														<Select.Content class="max-h-[200px] overflow-y-auto">
															<Select.Item value={null} label="None" />
															{#each allIcons as iconName}
																<Select.Item value={iconName}><Icon name={iconName} class="mr-2 h-4 w-4" /> {iconName}</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>

												<div class="flex flex-col gap-2">
													<div class="text-label-xs text-ink-50 font-bold">Trailing Icon</div>
													<Select.Root bind:value={el.trailingIcon}>
														<Select.Trigger placeholder="None">
															{#if el.trailingIcon}<Icon name={el.trailingIcon} class="mr-2 h-4 w-4" /> {el.trailingIcon}{:else}None{/if}
														</Select.Trigger>
														<Select.Content class="max-h-[200px] overflow-y-auto">
															<Select.Item value={null} label="None" />
															{#each allIcons as iconName}
																<Select.Item value={iconName}><Icon name={iconName} class="mr-2 h-4 w-4" /> {iconName}</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>

												<Button size="s" variant={el.isSubmit ? 'primary' : 'tertiary'} active={el.isSubmit} onclick={() => (el.isSubmit = !el.isSubmit)}>Acts as Submit</Button>
											</div>
										{/if}
									</Popover.Content>
								</Popover.Root>

								<button
									data-uiname={`del-btn-${el.id}`}
									data-tooltip="Remove"
									onclick={() => removeElement(el.id)}
									class="text-error hover:bg-error/10 flex h-6 w-6 items-center justify-center rounded-md transition-colors">
									<Icon name="trash" class="h-4 w-4" />
								</button>
							</div>

							<div data-uiname={`form-el-content-${el.id}`} class="pointer-events-none z-0 w-full">
								{#if el.type === 'title'}
									<div class="w-full">
										<h2 class="text-label-l text-ink-90 font-bold">{el.title || 'Untitled'}</h2>
										{#if el.subtitle}<p class="text-body-s text-ink-50">{el.subtitle}</p>{/if}
									</div>
								{:else if el.type === 'textblock'}
									<div class="w-full">
										<p class="text-body-m text-ink-90 text-{el.align} whitespace-pre-wrap">{el.content}</p>
									</div>
								{:else if el.type === 'icon'}
									<div class="flex w-full justify-center">
										<Icon name={el.iconName} class="{el.size} {el.color}" />
									</div>
								{:else if el.type === 'input'}
									<div class="w-full">
										{#snippet inputLeading()}<Icon name={el.leadingIcon as FigmaIconName} />{/snippet}
										{#snippet inputTrailing()}<Icon name={el.trailingIcon as FigmaIconName} />{/snippet}
										<Input
											label={el.label}
											type={el.inputType}
											placeholder={el.placeholder}
											required={el.required}
											leading={el.leadingIcon ? inputLeading : undefined}
											trailing={el.trailingIcon ? inputTrailing : undefined} />
									</div>
								{:else if el.type === 'button'}
									<div class="w-full">
										{#snippet btnLeading()}<Icon name={el.leadingIcon as FigmaIconName} />{/snippet}
										{#snippet btnTrailing()}<Icon name={el.trailingIcon as FigmaIconName} />{/snippet}
										<Button variant={el.variant} class="w-full" leading={el.leadingIcon ? btnLeading : undefined} trailing={el.trailingIcon ? btnTrailing : undefined}>
											{el.content}
										</Button>
									</div>
								{/if}
							</div>
						</div>

						{@render addDivider(index + 1)}
					{/each}
				</Form>

				<div
					data-uiname="form-resizer-right"
					onmousedown={(e) => initResize(e, 'right')}
					class="absolute top-0 right-[-16px] bottom-0 z-10 flex w-8 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover/container:opacity-100">
					<div class="bg-accent-500/50 hover:bg-accent-500 h-12 w-1 rounded-full transition-colors"></div>
				</div>
			</div>

			<Button data-uiname="reset-sandbox-button" variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute top-0 left-0">Reset Sandbox</Button>
		</div>

		<div data-uiname="sandbox-controls-grid" class="bg-level-2 border-border flex flex-col gap-8 border-t p-6 lg:flex-row">
			<div data-uiname="controls-col-props" class="flex flex-1 flex-col gap-6">
				<div class="mb-2 flex items-center">
					<div class="text-label-xs text-ink-50 flex items-center gap-2 font-bold tracking-wider uppercase">
						<Icon name="settings" class="h-4 w-4" /> Global Form Settings
					</div>
				</div>

				<div class="grid grid-cols-2 gap-6">
					<Input data-uiname="control-input-error" bind:value={formError} placeholder="Error Message" label="Global Error State" />
					<Input
						data-uiname="control-input-permission"
						bind:value={formPermission}
						placeholder="e.g. 'users.write'"
						label="Form Permission Block"
						tooltip="Locks all child inputs if the user lacks rights." />

					<div class="flex flex-col gap-2">
						<div class="text-label-xs text-ink-50 flex justify-between font-bold">
							Form Width <span class="text-ink-90 font-mono">{formWidth}px</span>
						</div>
						<input type="range" min="250" max="800" bind:value={formWidth} class="accent-accent-500 w-full" />
					</div>

					<div class="flex flex-col gap-2">
						<div class="text-label-xs text-ink-50 flex justify-between font-bold">
							Vertical Gap <span class="text-ink-90 font-mono">{formGap}px</span>
						</div>
						<input type="range" min="0" max="48" bind:value={formGap} class="accent-accent-500 w-full" />
					</div>

					<div class="col-span-2 flex flex-col gap-2">
						<div class="text-label-xs text-ink-50 font-bold">Padding</div>
						<div class="flex items-end gap-2">
							<div class="flex flex-col items-center gap-1">
								<span class="text-ink-50 text-[10px] uppercase">Top</span>
								<input
									type="number"
									value={pt}
									oninput={(e) => updatePadding(parseInt(e.currentTarget.value) || 0, 't')}
									class="bg-level-1 border-border rounded-m text-label-s text-ink-90 focus:ring-accent-500 w-16 border text-center outline-none focus:ring-1" />
							</div>
							<div class="flex flex-col items-center gap-1">
								<span class="text-ink-50 text-[10px] uppercase">Right</span>
								<input
									type="number"
									value={pr}
									oninput={(e) => updatePadding(parseInt(e.currentTarget.value) || 0, 'r')}
									class="bg-level-1 border-border rounded-m text-label-s text-ink-90 focus:ring-accent-500 w-16 border text-center outline-none focus:ring-1" />
							</div>
							<div class="flex flex-col items-center gap-1">
								<span class="text-ink-50 text-[10px] uppercase">Bottom</span>
								<input
									type="number"
									value={pb}
									oninput={(e) => updatePadding(parseInt(e.currentTarget.value) || 0, 'b')}
									class="bg-level-1 border-border rounded-m text-label-s text-ink-90 focus:ring-accent-500 w-16 border text-center outline-none focus:ring-1" />
							</div>
							<div class="flex flex-col items-center gap-1">
								<span class="text-ink-50 text-[10px] uppercase">Left</span>
								<input
									type="number"
									value={pl}
									oninput={(e) => updatePadding(parseInt(e.currentTarget.value) || 0, 'l')}
									class="bg-level-1 border-border rounded-m text-label-s text-ink-90 focus:ring-accent-500 w-16 border text-center outline-none focus:ring-1" />
							</div>

							<div class="mb-[2px] ml-2">
								<Button data-uiname="link-padding-btn" variant="tertiary" size="s" icon active={padLinked} onclick={() => (padLinked = !padLinked)} data-tooltip="Link Paddings">
									<Icon name="link" class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					<div class="col-span-2 flex items-end pb-1">
						<Button data-uiname="state-btn-enhance" size="s" variant={useEnhance ? 'primary' : 'tertiary'} active={useEnhance} onclick={() => (useEnhance = !useEnhance)}>Use SvelteKit Enhance</Button>
					</div>
				</div>
			</div>
		</div>

		<div data-uiname="sandbox-code-editor-wrapper" class="border-border relative flex min-h-[260px] flex-col justify-between border-t bg-neutral-800 sm:flex-row sm:items-start">
			<textarea
				data-uiname="live-code-textarea"
				value={editableCode}
				oninput={handleCodeInput}
				onfocus={() => (isCodeEditorFocused = true)}
				onblur={() => (isCodeEditorFocused = false)}
				class="text-label-s text-ink-10 z-10 min-h-[260px] w-full resize-none border-none bg-transparent p-6 font-mono outline-none focus:ring-0"
				spellcheck="false"></textarea>

			<div data-uiname="code-actions-wrapper" class="absolute top-4 right-4 z-20 flex shrink-0 items-center gap-2">
				<Button
					data-uiname="copy-code-button"
					variant="secondary"
					size="s"
					class="text-ink-10 hover:text-ink-90"
					data-tooltip={copiedCode ? '<b>Copied!</b>' : 'Copy Component Code'}
					onclick={() => copyToClipboard(editableCode, 'code')}>
					<Icon data-uiname="copy-code-icon" name="copy" class="mr-m" /> Code
				</Button>
			</div>
		</div>
	</section>

	<section data-uiname="api-reference-section">
		<h2 data-uiname="api-reference-title" class="text-label-m text-ink-90 mb-l font-bold">API Reference</h2>

		<div data-uiname="api-table-wrapper" class="border-border rounded-m overflow-hidden border">
			<table data-uiname="api-table" class="w-full text-left">
				<thead data-uiname="api-table-head" class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr data-uiname="api-table-head-row">
						<th data-uiname="api-th-prop" class="p-4 font-bold">Prop</th>
						<th data-uiname="api-th-type" class="p-4 font-bold">Type</th>
						<th data-uiname="api-th-default" class="p-4 font-bold">Default</th>
						<th data-uiname="api-th-desc" class="p-4 font-bold">Description</th>
					</tr>
				</thead>
				<tbody data-uiname="api-table-body" class="text-body-s text-ink-90 divide-border divide-y">
					<tr data-uiname="api-row-error">
						<td data-uiname="api-cell-prop-error" class="p-4 font-mono font-bold">error</td>
						<td data-uiname="api-cell-type-error" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-error" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-error" class="p-4">Renders a centralized error message at the bottom of the form.</td>
					</tr>
					<tr data-uiname="api-row-permission">
						<td data-uiname="api-cell-prop-permission" class="p-4 font-mono font-bold">permission</td>
						<td data-uiname="api-cell-type-permission" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-permission" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-permission" class="p-4">Context key. Auto-disables all child inputs and blocks submission if the user lacks the right.</td>
					</tr>
					<tr data-uiname="api-row-enhance">
						<td data-uiname="api-cell-prop-enhance" class="p-4 font-mono font-bold">enhance</td>
						<td data-uiname="api-cell-type-enhance" class="text-ink-50 p-4 font-mono">boolean | SubmitFunction</td>
						<td data-uiname="api-cell-default-enhance" class="p-4 font-mono">false</td>
						<td data-uiname="api-cell-desc-enhance" class="p-4">Applies SvelteKit's progressive enhancement to the form.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
