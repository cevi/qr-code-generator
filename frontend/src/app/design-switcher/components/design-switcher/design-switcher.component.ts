import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationFacade } from '../../../application-state/application.facade';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'design-switcher',
  styleUrls: ['./design-switcher.component.scss'],
  templateUrl: './design-switcher.component.html',
})
export class DesignSwitcherComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private readonly applicationFacade: ApplicationFacade) {}

  ngOnInit(): void {
    this.form = new FormGroup<ColorForm>({
      color: new FormControl('cevi', { nonNullable: true, validators: [Validators.required] }),
    });
    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap((formValues) => {
          this.applicationFacade.setColor(formValues.color);
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

interface ColorForm {
  color: FormControl<string>;
}
