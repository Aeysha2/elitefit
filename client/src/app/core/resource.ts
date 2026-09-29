import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith } from 'rxjs';

export interface Loadable<T> {
  status: 'loading' | 'error' | 'ready';
  data: T | null;
}

/** Transforme un appel HTTP en signal avec un état de chargement et d'erreur. */
export function loadable<T>(source: Observable<T>): Signal<Loadable<T>> {
  return toSignal(
    source.pipe(
      map((data): Loadable<T> => ({ status: 'ready', data })),
      catchError(() => of<Loadable<T>>({ status: 'error', data: null })),
      startWith<Loadable<T>>({ status: 'loading', data: null }),
    ),
    { requireSync: true },
  );
}
