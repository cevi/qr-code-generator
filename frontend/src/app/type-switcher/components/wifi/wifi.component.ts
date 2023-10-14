import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationFacade } from '../../../application-state/application.facade';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'qr-code-wifi',
  templateUrl: './wifi.component.html',
})
export class WifiComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();
  private TEMPLATE: string = 'WIFI:T:WPA;S:mynetwork;P:mypass;;';

  constructor(private readonly applicationFacade: ApplicationFacade) {}

  ngOnInit(): void {
    this.form = new FormGroup<WifiForm>({
      ssid: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        tap((formValues) => {
          this.buildWifiContent(formValues);
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildWifiContent(values: any): void {
    let qrContent = this.TEMPLATE;
    qrContent = qrContent.replace('mypass', values.password);
    qrContent = qrContent.replace('mynetwork', values.ssid);
    this.applicationFacade.setContent(qrContent);
  }
}

interface WifiForm {
  ssid: FormControl<string>;
  password: FormControl<string>;
}
