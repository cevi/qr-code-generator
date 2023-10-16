import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationFacade } from '../../../application-state/application.facade';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'qr-code-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
})
export class LinkComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();
  constructor(private readonly applicationFacade: ApplicationFacade) {}

  ngOnInit() {
    this.form = new FormGroup<UrlForm>({
      url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        tap((formValues) => {
          this.applicationFacade.setContent(formValues.url);
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

interface UrlForm {
  url: FormControl<string>;
}
