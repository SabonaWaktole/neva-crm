import type { ReactNode } from 'react';
import { useIsDesktop } from '../../../hooks/useMediaQuery';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  /** Stable identifier, also used as the React key for cells. */
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Fixed width, e.g. '48px'. Useful for action columns. */
  width?: string;
  /** Keeps cell content on a single line. */
  nowrap?: boolean;
  /**
   * Label shown beside the value in the mobile card layout. Defaults to
   * `header` when it is a string. Pass `null` to render the value alone,
   * which suits the primary/title cell of a card.
   */
  cardLabel?: ReactNode | null;
  /** Omits this column from the mobile card layout entirely. */
  hideOnCard?: boolean;
}

export interface DataTableEmptyState {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  /** Number of skeleton rows rendered while loading. */
  loadingRowCount?: number;
  empty?: DataTableEmptyState;
  onRowClick?: (row: T) => void;
  /** Pins the header while the table body scrolls. */
  stickyHeader?: boolean;
  /** Accessible description of the table's contents. */
  caption?: string;
  className?: string;
}

const alignClass = <T,>(column: DataTableColumn<T>) => {
  if (column.align === 'right') return styles.alignRight;
  if (column.align === 'center') return styles.alignCenter;
  return '';
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  loadingRowCount = 5,
  empty,
  onRowClick,
  stickyHeader = true,
  caption,
  className = '',
}: DataTableProps<T>) {
  const isEmpty = !isLoading && rows.length === 0;
  const isInteractive = Boolean(onRowClick);
  // Render one layout or the other, never both, so rows are not duplicated
  // into the DOM and accessibility tree.
  const isDesktop = useIsDesktop();

  const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');
  const tableClasses = [styles.table, stickyHeader ? styles.stickyHeader : '']
    .filter(Boolean)
    .join(' ');

  if (isEmpty && empty) {
    return (
      <div className={wrapperClasses}>
        <div className={styles.emptyState}>
          {empty.icon && <div className={styles.emptyIcon}>{empty.icon}</div>}
          <p className={styles.emptyTitle}>{empty.title}</p>
          {empty.description && (
            <p className={styles.emptyDescription}>{empty.description}</p>
          )}
          {empty.action && <div className={styles.emptyAction}>{empty.action}</div>}
        </div>
      </div>
    );
  }

  const handleRowKeyDown = (event: React.KeyboardEvent, row: T) => {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  };

  if (!isDesktop) {
    return (
      <div className={wrapperClasses}>
        <div className={styles.cardList}>
          {isLoading
            ? Array.from({ length: loadingRowCount }).map((_, index) => (
                <div key={`skeleton-card-${index}`} className={styles.card}>
                  <span className={`${styles.skeleton} ${styles.skeletonCardLine}`} />
                  <span className={`${styles.skeleton} ${styles.skeletonCardLine}`} />
                </div>
              ))
            : rows.map((row) => {
                const cardColumns = columns.filter((column) => !column.hideOnCard);
                return (
                  <div
                    key={rowKey(row)}
                    className={[styles.card, isInteractive ? styles.cardInteractive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={isInteractive ? (e) => handleRowKeyDown(e, row) : undefined}
                    tabIndex={isInteractive ? 0 : undefined}
                    role={isInteractive ? 'button' : undefined}
                  >
                    {cardColumns.map((column) => {
                      const label =
                        column.cardLabel === null
                          ? null
                          : column.cardLabel ??
                            (typeof column.header === 'string' ? column.header : null);

                      return (
                        <div key={column.id} className={styles.cardField}>
                          {label && <span className={styles.cardLabel}>{label}</span>}
                          <span className={styles.cardValue}>{column.render(row)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          {isEmpty && !empty && <div className={styles.inlineEmpty}>No results</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <div className={styles.scrollArea}>
        <table className={tableClasses}>
          {caption && <caption className={styles.visuallyHidden}>{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={alignClass(column)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: loadingRowCount }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className={styles.skeletonRow}>
                    {columns.map((column) => (
                      <td key={column.id} className={alignClass(column)}>
                        <span className={styles.skeleton} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={isInteractive ? styles.rowInteractive : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={isInteractive ? (e) => handleRowKeyDown(e, row) : undefined}
                    tabIndex={isInteractive ? 0 : undefined}
                    role={isInteractive ? 'button' : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={[alignClass(column), column.nowrap ? styles.nowrap : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
            {isEmpty && !empty && (
              <tr>
                <td colSpan={columns.length} className={styles.inlineEmpty}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
