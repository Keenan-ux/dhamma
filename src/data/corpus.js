// Tree-shape helpers used by BrowseView. These operate on a tree fetched
// from /api/corpus (and transformed by useCorpus); pass the tree in
// explicitly so the helpers are pure functions, easy to test in isolation.
//
// Tree node shape:
//   { id, name, subtitle?, children?, passageId?, stub? }
// - Internal nodes have `children`.
// - Leaves (passages) have `passageId`.
// - Stubs are visible-but-muted; no children, no passageId.

// Walk a path of node ids, returning the matched nodes' names.
export function pathNames(tree, path) {
  const out = [];
  let level = tree;
  for (const id of path) {
    const node = level.find((n) => n.id === id);
    if (!node) break;
    out.push(node.name);
    level = node.children || [];
  }
  return out;
}

// Resolve children at a given path. Returns null if path is invalid.
export function childrenAtPath(tree, path) {
  let level = tree;
  for (const id of path) {
    const node = level.find((n) => n.id === id);
    if (!node?.children) return null;
    level = node.children;
  }
  return level;
}

// Depth-first list of all non-stub leaves (nodes with passageId). Order in
// the tree = order of canonical traversal, which is the reading order for
// prev/next adjacent navigation.
export function collectLeaves(tree, out = []) {
  for (const n of tree || []) {
    if (n.passageId && !n.stub) out.push(n);
    if (n.children) collectLeaves(n.children, out);
  }
  return out;
}

// Path of parent ids leading to a leaf. Useful when adjacent-nav jumps the
// user into a different branch — the column display follows along.
export function pathToLeaf(tree, leafId, prefix = []) {
  for (const n of tree || []) {
    if (n.id === leafId) return prefix;
    if (n.children) {
      const sub = pathToLeaf(n.children, leafId, [...prefix, n.id]);
      if (sub) return sub;
    }
  }
  return null;
}
