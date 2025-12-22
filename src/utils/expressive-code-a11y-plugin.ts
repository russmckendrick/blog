/**
 * Expressive Code plugin to add accessibility attributes
 *
 * Fixes several accessibility issues:
 * 1. Copy buttons have title but no aria-label
 * 2. Pre elements with role="region" need an accessible name (aria-label)
 * 3. Scrollable pre elements need tabindex="0" for keyboard access
 */

// Simple plugin factory without type imports to avoid pnpm resolution issues
export const expressiveCodeA11yPlugin = () => {
	return {
		name: 'expressive-code-a11y',
		hooks: {
			postprocessRenderedBlock: ({ codeBlock, renderData }: { codeBlock: { language: string; title?: string }; renderData: { blockAst: any } }) => {
				// Get title if available (from meta string like ```js title="example.js")
				const title = codeBlock.title;
				const language = codeBlock.language || 'text';

				// Build descriptive aria-label for code blocks
				let ariaLabel: string;
				if (title) {
					// Use title directly for titled blocks (terminals, named files)
					ariaLabel = title;
				} else {
					// Always include language, capitalize first letter
					const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);
					ariaLabel = `${langDisplay} code`;
				}

				// Process the rendered HTML to add accessibility attributes
				const processNode = (node: any) => {
					if (!node) return;

					if (node.type === 'element') {
						// Ensure node.properties exists and we're modifying it directly
						if (!node.properties) {
							node.properties = {};
						}
						const props = node.properties;

						// Handle button elements
						if (node.tagName === 'button') {
							// If button has title but no aria-label, add it
							if (props.title && !props['aria-label']) {
								props['aria-label'] = props.title;
							}

							// Handle buttons with data-copied (Expressive Code specific)
							if (props['data-copied'] && !props['aria-label']) {
								props['aria-label'] = 'Copy to clipboard';
							}
						}

						// Handle pre elements - Expressive Code adds role="region" client-side for scrollable content
						// We add aria-label to ALL pre elements so it's ready when role="region" is applied
						if (node.tagName === 'pre') {
							// Add aria-label for when role="region" is dynamically applied
							if (!props['aria-label']) {
								props['aria-label'] = ariaLabel;
							}
							// Add tabindex="0" for keyboard accessibility on scrollable content
							// Always set to 0 unless explicitly set to a different value
							if (props.tabIndex === undefined && props.tabindex === undefined) {
								props.tabIndex = 0;
							}
						}
					}

					// Recursively process children
					if (node.children && Array.isArray(node.children)) {
						node.children.forEach(processNode);
					}
				};

				// Process the entire block AST
				processNode(renderData.blockAst);
			}
		}
	};
};
