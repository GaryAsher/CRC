<script lang="ts">
	import { onMount } from 'svelte';

	const MIN_PAGE_HEIGHT = 600;
	const SCROLL_PERCENTAGE = 0.75;
	const FALLBACK_THRESHOLD = 300;

	let visible = $state(false);

	function shouldShow(): boolean {
		const scrollTop = window.scrollY;
		const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

		if (scrollableHeight <= 0) return false;

		if (scrollableHeight >= MIN_PAGE_HEIGHT) {
			return scrollTop / scrollableHeight >= SCROLL_PERCENTAGE;
		}

		return scrollTop >= Math.min(FALLBACK_THRESHOLD, scrollableHeight * 0.5);
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	onMount(() => {
		function onScroll() {
			visible = shouldShow();
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<button
	class="back-to-top"
	class:back-to-top--visible={visible}
	onclick={scrollToTop}
	aria-label="Back to top"
>
	↑
</button>

<style>
	.back-to-top {
		position: fixed;
		bottom: 5rem;
		right: 2rem;
		z-index: 90;

		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;

		font-size: 1.5rem;
		font-weight: bold;
		color: #fff;
		background: var(--accent);
		border: none;
		border-radius: 50%;
		cursor: pointer;

		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

		opacity: 0;
		pointer-events: none;
		transform: translateY(20px);
		transition: transform 0.25s ease-in, opacity 0.25s ease-out, background 0.2s ease;
	}

	.back-to-top--visible {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
		transition: transform 0.3s ease-out, opacity 0.4s ease-in, background 0.2s ease;
	}

	.back-to-top:hover {
		transform: translateY(-3px);
		filter: brightness(1.1);
	}

	.back-to-top:focus {
		outline: 2px solid var(--focus, var(--accent));
		outline-offset: 2px;
	}

	@media (max-width: 600px) {
		.back-to-top {
			bottom: 4rem;
			right: 1rem;
			width: 44px;
			height: 44px;
			font-size: 1.25rem;
		}
	}
</style>
