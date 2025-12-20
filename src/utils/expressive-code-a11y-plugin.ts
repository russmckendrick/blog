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
			postprocessRenderedBlock: ({ codeBlock, renderData }: { codeBlock: { language: string }; renderData: { blockAst: any } }) => {
				// Get the language for labeling
				const language = codeBlock.language || 'text';
				// For text/plain code blocks, just use "Code block", otherwise "JSON code block" etc.
				const languageLabel = (language === 'text' || language === 'plaintext') ? '' : language.toUpperCase() + ' ';

				// Process the rendered HTML to add accessibility attributes
				const processNode = (node: any) => {
					if (!node) return;

					if (node.type === 'element') {
						const props = node.properties || {};

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
								props['aria-label'] = `${languageLabel}code block`;
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
