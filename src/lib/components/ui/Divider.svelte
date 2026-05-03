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
			// *TODO* go away from border towards stroke for rounded ends and better alignment
			s: v ? 'w-0 border-l-[0.5px]' : 'h-0  border-t-[0.5px]',
			m: v ? 'w-0 border-l' : 'h-0 border-t',
			l: v ? 'w-0 border-l-2' : 'h-0 border-t-2'
		};
		return map[size];
	});
</script>

<div class={cn(v ? 'py-s' : 'px-s', 'flex h-3 items-center')}>
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
