import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApplicationFacade } from '../../../application-state/application.facade';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, Subject, takeUntil, tap } from 'rxjs';
import { ShortenerService } from '../../../shortener/shortener.service';

@Component({
  selector: 'qr-code-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
})
export class LinkComponent implements OnInit, OnDestroy {
  form: FormGroup;
  shortening = false;
  shortenedFrom = '';
  shortenError = '';
  private destroy$ = new Subject<void>();
  constructor(
    private readonly applicationFacade: ApplicationFacade,
    private readonly shortener: ShortenerService,
  ) {}

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

  get url(): string {
    return this.form?.controls['url'].value?.trim() ?? '';
  }

  /**
   * Shortening is deliberately an explicit click rather than something that
   * happens while typing: every call registers a new link with the shortener.
   */
  async shortenUrl(): Promise<void> {
    const target = this.url;

    if (this.shortening || target === '') {
      return;
    }

    this.shortening = true;
    this.shortenError = '';

    try {
      const link = await this.shortener.shorten(target);
      // Writing the short link back into the form regenerates the QR code,
      // so the code encodes the short URL from here on.
      this.form.controls['url'].setValue(link);
      this.shortenedFrom = target;
    } catch (error) {
      this.shortenError = error instanceof Error ? error.message : 'Der Link konnte nicht gekürzt werden.';
    } finally {
      this.shortening = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

interface UrlForm {
  url: FormControl<string>;
}
