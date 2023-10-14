import { Component, OnDestroy, OnInit } from '@angular/core';
import VCard from 'vcard-creator';
import { ApplicationFacade } from '../../../application-state/application.facade';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'qr-code-contact',
  templateUrl: './contact.component.html',
})
export class ContactComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private readonly applicationFacade: ApplicationFacade) {}

  ngOnInit(): void {
    this.form = new FormGroup<ContactForm>({
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      zip: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      phoneNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      mail: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      street: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        debounceTime(750),
        tap((formValues) => {
          this.buildVCard(formValues);
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildVCard(value: any): void {
    const vcard = new VCard();
    vcard
      .addName(value.lastName, value.firstName)
      .addCompany('Cevi')
      .addEmail(value.mail)
      .addPhoneNumber(value.phoneNumber, 'PREF')
      .addAddress('', '', value.street, value.city, '', value.city, 'Switzerland');
    this.applicationFacade.setContent(vcard.toString());
  }
}

interface ContactForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  mail: FormControl<string>;
  phoneNumber: FormControl<string>;
  street: FormControl<string>;
  zip: FormControl<string>;
  city: FormControl<string>;
}
