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
  <path d="M12.9815 16.1496C12.4178 16.6377 11.5812 16.6377 11.0175 16.1496L4.64856 10.6339C3.59871 9.72469 4.24172 8 5.63055 8L18.3685 8C19.7573 8 20.4003 9.72469 19.3505 10.6339L12.9815 16.1496Z"/>
</svg>

