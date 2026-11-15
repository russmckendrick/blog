import { SKIP, visit } from 'unist-util-visit'

// Just the mdast shapes used here; `mdast` types are not a direct dependency.
interface MdNode {
	type: string
	value?: string
	children?: MdNode[]
}

/**
 * Remark plugin that removes code blocks with no content.
 *
 * An empty fence reaches rehype as a `<code>` with no text node, which
 * rehype-expressive-code cannot read and the whole build fails on. They only
 * come from stray or doubled-up closing fences, so there is nothing to render.
 */
export function remarkDropEmptyCode() {
	return (tree: MdNode) => {
		visit(tree, 'code', (node: MdNode, index, parent: MdNode | undefined) => {
			if (node.value?.trim() || !parent?.children || index === undefined) return
			parent.children.splice(index, 1)
			return [SKIP, index]
		})
	}
}
