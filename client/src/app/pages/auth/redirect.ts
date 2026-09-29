/** N'accepte qu'un chemin interne comme destination après connexion. */
export function safeRedirect(value: string | null | undefined): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}
