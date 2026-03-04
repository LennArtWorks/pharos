<script lang="ts">
	// We accept the exact same props that our wrapper passes down.
	// We ignore 'stroke' since this is a filled icon!
	let {
		color = 'currentColor',
		class: className = '',
		stroke // Destructure this just to prevent Svelte warnings, but we won't use it
	} = $props();
</script>

<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class={className} stroke={color} stroke-width="2">
	<path d="M14 3V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8H19" stroke-linecap="round" stroke-linejoin="round" />
	<path
		d="M12 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H14L19 8V11.5"
		stroke-linecap="round"
		stroke-linejoin="round" />
	<path
		d="M19.031 20.5C18.5006 20.5 17.9919 20.2893 17.6168 19.9142C17.2417 19.5391 17.031 19.0304 17.031 18.5C17.031 17.9696 17.2417 17.4609 17.6168 17.0858C17.9919 16.7107 18.5006 16.5 19.031 16.5M19.031 20.5C19.5614 20.5 20.0701 20.2893 20.4452 19.9142C20.8203 19.5391 21.031 19.0304 21.031 18.5C21.031 17.9696 20.8203 17.4609 20.4452 17.0858C20.0701 16.7107 19.5614 16.5 19.031 16.5M19.031 20.5V22M19.031 16.5V15M22.062 16.75L20.763 17.5M17.3 19.5L16 20.25M16 16.75L17.3 17.5M20.763 19.5L22.063 20.25"
		stroke-linecap="round"
		stroke-linejoin="round" />
</svg>
