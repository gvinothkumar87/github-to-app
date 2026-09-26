// SQLite uses 0/1 while server records use booleans. Missing status is not active.
export const isActiveParty = (party: { is_active?: unknown } | null | undefined): boolean =>
  party?.is_active === true || party?.is_active === 1;
