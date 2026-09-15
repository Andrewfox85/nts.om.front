/* eslint-disable */
export function updateRightPanelHeight(gridRoot: HTMLElement): void {
  const header: HTMLElement = gridRoot.querySelector('.dx-datagrid-headers') as HTMLElement;
  const rowsView: HTMLElement = gridRoot.querySelector('.dx-datagrid-rowsview') as HTMLElement;

  if (!header || !rowsView) {
    return;
  }

  const tableHeight: number = header.offsetHeight + rowsView.offsetHeight;
  const bodyContent: HTMLElement = gridRoot.closest('.body_content') as HTMLElement;

  if (!bodyContent) {
    return;
  }

  const headerTable: HTMLElement = header.querySelector('.dx-datagrid-table') as HTMLElement | null;
  const rowsTable: HTMLElement = rowsView.querySelector('.dx-datagrid-table') as HTMLElement | null;
  const contentWidth: number = Math.max(headerTable?.scrollWidth ?? 0, rowsTable?.scrollWidth ?? 0);
  const viewportWidth: number = rowsView.clientWidth;

  const styles: CSSStyleDeclaration = getComputedStyle(bodyContent);
  const gapPx: number =
    Number(styles.getPropertyValue('--om-right-panel-gap').trim().replace('px', '')) || 0;

  const leftInsideGrid: number = Math.min(contentWidth, viewportWidth) + gapPx;

  const bodyRect: DOMRect = bodyContent.getBoundingClientRect();
  const gridRect: DOMRect = gridRoot.getBoundingClientRect();
  const leftInBodyContent: number = Math.round((gridRect.left - bodyRect.left) + leftInsideGrid);

  bodyContent.style.setProperty('--om-grid-table-height', `${tableHeight}px`);
  bodyContent.style.setProperty('--om-right-panel-left', `${leftInBodyContent}px`);
}
