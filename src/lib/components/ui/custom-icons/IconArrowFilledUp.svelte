<script lang="ts">
	// We accept the exact same props that our wrapper passes down.
	// We ignore 'stroke' since this is a filled icon!
	let {
		color = 'currentColor',
		class: className = '',
		stroke // Destructure this just to prevent Svelte warnings, but we won't use it
	} = $props();
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24" 
  class={className}
  fill={color}
>
  <path d="M11.0185 7.35042C11.5822 6.86228 12.4188 6.86228 12.9825 7.35042L19.3514 12.8661C20.4013 13.7753 19.7583 15.5 18.3695 15.5L5.63152 15.5C4.2427 15.5 3.59969 13.7753 4.64954 12.8661L11.0185 7.35042Z" />
</svg>


