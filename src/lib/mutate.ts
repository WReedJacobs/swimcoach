interface MutationResult {
  error?: unknown
  count?: number | null
}

/**
 * Throws if a Supabase mutation returned zero affected rows.
 * Pass { count: 'exact' } to the query to get a count; without it count is null
 * and this is a no-op (silent skip rather than false alarm).
 */
export function assertAffected(
  result: MutationResult,
  message = 'No rows were affected — the record may not exist or you may not have permission to modify it.',
): void {
  if (result.error) throw result.error
  if (result.count === 0) throw new Error(message)
}
