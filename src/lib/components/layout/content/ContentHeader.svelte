<script lang="ts">
	/**
	 * import ContentHeader from '$lib/components/layout/Sidebar.svelte';
	 */

	import Button from '$lib/components/ui/Button.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
</script>

<header class="bg-level-1 px-l gap-2xl h-main-l flex items-center">
	<div data-uiname="between-file-naviagtion" class="gap-m flex items-center">
		<div data-uiname="backforth-arrows" class="gap-m flex">
			<Button variant="tertiary" size="s"><Icon name="arrow-left" /></Button>
			<Button variant="tertiary" size="s"><Icon name="arrow-right" /></Button>
		</div>
		<!-- <Divider v /> -->
		<div data-uiname="opened-tabs" class="gap-m flex items-center">
			<div class="border-border h-5 w-1 border-l"></div>
			<File filetype="document" active minimized>document</File>
			<File filetype="tasks" active minimized>tasks</File>
		</div>
	</div>
	<div data-uiname="directory-navigation" class="gap-3xs mr-auto flex items-center">
		<File filetype="folder" class="text-ink-50" iconHidden>Workspace 1</File>
		<span class="font-label-s text-ink-50 font-semibold">/</span>
		<File filetype="folder" class="text-ink-50" iconHidden>Folder</File>
		<span class="font-label-s text-ink-50 font-semibold">/</span>
		<File filetype="document">Document</File>
	</div>
	<Button variant="tertiary" size="s"><Icon name="dots" /></Button>
</header>
