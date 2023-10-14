import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationFacade } from '../../../application-state/application.facade';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'qr-code-phone',
  templateUrl: './phone.component.html',
})
export class PhoneComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();
  constructor(private readonly applicationFacade: ApplicationFacade) {}

  ngOnInit() {
    this.form = new FormGroup<PhoneForm>({
      phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        tap((formValues) => {
          this.applicationFacade.setContent('tel:' + formValues.phone);
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

interface PhoneForm {
  phone: FormControl<string>;
}
