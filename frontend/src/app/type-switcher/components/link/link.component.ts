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
  // Kept out of the form group on purpose: the group's value changes drive
  // the QR code content, and typing a slug must not regenerate the code.
  slugControl = new FormControl('', { nonNullable: true });
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
    // An error about the previous slug no longer applies once it is edited.
    this.slugControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => (this.shortenError = ''));
  }

  get url(): string {
    return this.form?.controls['url'].value?.trim() ?? '';
  }

  get slug(): string {
    return this.slugControl.value.trim();
  }

  get slugInvalid(): boolean {
    return this.slug !== '' && !/^[A-Za-z0-9_-]{1,64}$/.test(this.slug);
  }

  /**
   * Shortening is deliberately an explicit click rather than something that
   * happens while typing: every call registers a new link with the shortener.
   */
  async shortenUrl(): Promise<void> {
    const target = this.url;

    if (this.shortening || target === '' || this.slugInvalid) {
      return;
    }

    this.shortening = true;
    this.shortenError = '';

    try {
      const link = await this.shortener.shorten(target, this.slug);
      // Writing the short link back into the form regenerates the QR code,
      // so the code encodes the short URL from here on.
      this.form.controls['url'].setValue(link);
      this.shortenedFrom = target;
      // The slug is taken now; a second click would only report it as in use.
      this.slugControl.setValue('');
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
