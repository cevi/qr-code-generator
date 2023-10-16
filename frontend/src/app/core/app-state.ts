import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

@Injectable()
export class AppState {
  constructor(private readonly store: Store) {}

  select<T>(selector: (state: any, ...states: any[]) => T): T {
    return this.store.selectSnapshot(selector);
  }

  select$<T>(selector: (state: any, ...states: any[]) => T): Observable<T> {
    return this.store.select(selector);
  }

  dispatch(event: any | any[]): Observable<any> {
    return this.store.dispatch(event);
  }
}
