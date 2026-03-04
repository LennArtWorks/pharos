<script lang="ts">
	/**
	 * <Divider />
	 *
	 * <Divider size="s" class="bg-border/20" />
	 *
	 * <div class="flex h-5 items-center">
	 *   <Icon name="search" />
	 *   <Divider v size="s" />
	 *   <Icon name="plus" />
	 * </div>
	 */

	import { cn } from '$lib/utils';

	type Props = {
		v?: boolean; // Vertical
		size?: 's' | 'm' | 'l';
		class?: string;
	};

	let { v = false, size = 'm', class: className = '' }: Props = $props();

	// We use $derived so Svelte tracks changes to 'v' and 'size'
	const thicknessClass = $derived.by(() => {
		const map = {
			s: v ? 'w-1 border-l-[0.5px]' : 'h-1  border-t-[0.5px]',
			m: v ? 'w-1 border-l' : 'h-1 border-t',
			l: v ? 'w-1 border-l-2' : 'h-1 border-t-2'
		};
		return map[size];
	});
</script>

<div class={v ? 'py-s' : 'px-s'}>
	<div
		role="separator"
		aria-orientation={v ? 'vertical' : 'horizontal'}
		class={cn(
			'shrink-0',
			/* Default color if no bg- class is provided in className */
			!className.includes('border-') && 'border-border',
			v ? 'mx-xs h-full' : 'my-xs w-full',
			thicknessClass,
			className,
			'bg-transparent'
		)}>
	</div>
</div>
