/** Checks whether the platform's database is reachable, for the System Health card. */
export interface IDatabaseHealthChecker {
  /** Resolves true if a trivial query against the database succeeds. */
  checkConnection(): Promise<boolean>;
}
