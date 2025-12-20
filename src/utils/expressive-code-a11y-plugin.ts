/**
 * Expressive Code plugin to add aria-labels to copy buttons
 *
 * The built-in copy button has a title attribute but no aria-label,
 * which causes accessibility issues. This plugin adds aria-label
 * at build time by processing the rendered HTML.
 */

// Simple plugin factory without type imports to avoid pnpm resolution issues
export const expressiveCodeA11yPlugin = () => {
	return {
		name: 'expressive-code-a11y',
		hooks: {
			postprocessRenderedBlock: ({ renderData }: { renderData: { blockAst: any } }) => {
				// Process the rendered HTML to add aria-labels
				const processNode = (node: any) => {
					if (!node) return;

					// Check if this is a button element
					if (node.type === 'element' && node.tagName === 'button') {
						const props = node.properties || {};

						// If button has title but no aria-label, add it
						if (props.title && !props['aria-label']) {
							props['aria-label'] = props.title;
						}

						// Also handle buttons with data-copied (Expressive Code specific)
						if (props['data-copied'] && !props['aria-label']) {
							props['aria-label'] = 'Copy to clipboard';
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
