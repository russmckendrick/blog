import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';

/**
 * Rehype plugin to add external link indicators
 * Ported from Hugo's external link render hook
 */
export function rehypeExternalLinks() {
	return (tree: Root) => {
		visit(tree, 'element', (node: Element, index, parent) => {
			// Only process anchor tags
			if (node.tagName !== 'a') return;

			const href = node.properties?.href as string;
			if (!href || !href.startsWith('http')) return;

			// Check if link text contains [noExternalIcon]
			const textContent = getTextContent(node);
			const hasNoExternalIcon = textContent.includes('[noExternalIcon]');
			const hasNoSpace = textContent.includes('[noSpace]');

			// Add target and rel attributes for external links
			node.properties = {
				...node.properties,
				target: '_blank',
				rel: 'nofollow noopener noreferrer',
				class: 'external-link',
			};

			// Clean up text content
			if (hasNoExternalIcon || hasNoSpace) {
				cleanTextContent(node, hasNoExternalIcon, hasNoSpace);
			}

			// Add external link icon wrapper if not explicitly disabled
			if (!hasNoExternalIcon && parent && typeof index === 'number') {
				// Create wrapper span
				const wrapper: Element = {
					type: 'element',
					tagName: 'span',
					properties: { class: 'external-link-wrapper' },
					children: [
						node,
						{
							type: 'element',
							tagName: 'span',
							properties: {
								class: hasNoSpace ? 'external-link-icon no-space' : 'external-link-icon',
							},
							children: [{ type: 'text', value: '↗' }],
						},
					],
				};

				// Replace the original link with the wrapper
				parent.children[index] = wrapper;
			}
		});
	};
}

/**
 * Get text content from a node recursively
 */
function getTextContent(node: Element): string {
	let text = '';
	for (const child of node.children) {
		if (child.type === 'text') {
			text += (child as Text).value;
		} else if (child.type === 'element') {
			text += getTextContent(child as Element);
		}
	}
	return text;
}

/**
 * Clean up text content by removing special markers
 */
function cleanTextContent(node: Element, removeNoExternalIcon: boolean, removeNoSpace: boolean) {
	for (const child of node.children) {
		if (child.type === 'text') {
			let value = (child as Text).value;
			if (removeNoExternalIcon) {
				value = value.replace(/\[noExternalIcon\]/g, '');
			}
			if (removeNoSpace) {
				value = value.replace(/\[noSpace\]/g, '');
			}
			(child as Text).value = value;
		} else if (child.type === 'element') {
			cleanTextContent(child as Element, removeNoExternalIcon, removeNoSpace);
		}
	}
}