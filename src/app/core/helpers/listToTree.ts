/* eslint-disable */
import { LimitsTreeNode } from "../interfaces/interface";

type TreeNode = {
  children: TreeNode[];
} & LimitsTreeNode;

/**
 * @description converts array of nodes into tree-like object
 * @param items array of nodes
 */
const listToTree = (items: LimitsTreeNode[] = []) => {
  const map = new Map<number, TreeNode>();
  items.forEach((item) => {
    map.set(item.linkId, { ...item, children: [] });
  });

  const roots: TreeNode[] = [];

  map.forEach((item) => {
    if (item.parentId !== 0 && map.has(item.parentId)) {
      const parent = map.get(item.parentId);
      parent.children.push(item);
    } else if (item.parentId === 0) {
      roots.push(item);
    }
  });

  return roots;
};

/**
 * @description merges two trees where tree1 acts a base while tree2 fills it with children
 * @param tree1 a base tree
 * @param tree2 a tree with all the children
 * @returns the result of merging tree1 and tree2
 */
const getCommonFromList = (tree1: TreeNode[], tree2: TreeNode[]) => {
  const res: TreeNode[] = [];

  for (let i = 0; i < tree2.length; i++) {
    const found = tree1.find((it) => it.linkId === tree2[i].linkId);

    if (found && found.hasChildren === false) {
      res.push(tree2[i]);
    }

    if (found && found.hasChildren === true) {
      const children = getCommonFromList(found.children, tree2[i].children);
      res.push({ ...tree2[i], children });
    }
  }

  return res;
};

export { type TreeNode, listToTree, getCommonFromList };
