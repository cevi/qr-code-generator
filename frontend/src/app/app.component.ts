import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ApplicationFacade } from './application-state/application.facade';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, Subject, takeUntil, tap } from 'rxjs';
import { environment as env } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  png_src: SafeUrl = 'assets/qr_code.png';
  svg_src: SafeUrl = 'assets/qr_code.svg';
  pdf_src: SafeUrl | null = null;
  pdfTitle: string = '';
  pdfSubtitle: string = '';
  showPdfUrl: boolean = true;

  private title$ = new BehaviorSubject<string>('');
  private subtitle$ = new BehaviorSubject<string>('');
  private showUrl$ = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();

  constructor(
    private sanitizer: DomSanitizer,
    readonly applicationFacade: ApplicationFacade,
  ) {}

  public getSantizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get downloadBaseName(): string {
    const raw = (this.pdfTitle || this.pdfSubtitle || '').trim();
    if (!raw) {
      return 'cevi-qr-code';
    }
    // Strip emojis and unicode symbols so the filesystem filename is always clean across Windows, Mac and Linux
    const withoutEmojis = raw
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '');

    const clean = withoutEmojis
      .replace(/[\x00-\x1f\\/:*?"<>|]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    return clean || 'cevi-qr-code';
  }

  get pngDownloadFilename(): string {
    return `${this.downloadBaseName}.png`;
  }

  get svgDownloadFilename(): string {
    return `${this.downloadBaseName}.svg`;
  }

  get pdfDownloadFilename(): string {
    return `${this.downloadBaseName}.pdf`;
  }

  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pdfTitle = input.value;
    this.title$.next(input.value);
  }

  onSubtitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pdfSubtitle = input.value;
    this.subtitle$.next(input.value);
  }

  onShowPdfUrlChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.showPdfUrl = input.checked;
    this.showUrl$.next(input.checked);
  }

  generateQrCode(
    content: string,
    color: string,
    title: string = this.pdfTitle,
    subtitle: string = this.pdfSubtitle,
    showUrl: boolean = this.showPdfUrl
  ): void {
    const settings = {
      text: content,
      options: { color_scheme: color },
    };

    fetch(`${env.backend_url}/png`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then((res) => res.arrayBuffer())
      .then((png) => {
        const blob = new Blob([png], { type: 'image/png' });
        this.png_src = this.getSantizeUrl(URL.createObjectURL(blob));
      });

    fetch(`${env.backend_url}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then((res) => res.arrayBuffer())
      .then((svg) => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        this.svg_src = this.getSantizeUrl(URL.createObjectURL(blob));
      });

    const pdfSettings = {
      text: content,
      title: title,
      subtitle: subtitle,
      show_url: showUrl,
      options: { color_scheme: color },
    };

    fetch(`${env.backend_url}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pdfSettings),
    })
      .then((res) => res.arrayBuffer())
      .then((pdf) => {
        const blob = new Blob([pdf], { type: 'application/pdf' });
        this.pdf_src = this.getSantizeUrl(URL.createObjectURL(blob));
      });
  }

  ngOnInit(): void {
    combineLatest([
      this.applicationFacade.content,
      this.applicationFacade.color,
      this.title$.pipe(debounceTime(300), distinctUntilChanged()),
      this.subtitle$.pipe(debounceTime(300), distinctUntilChanged()),
      this.showUrl$.pipe(distinctUntilChanged()),
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([content, color, title, subtitle, showUrl]) => {
          this.generateQrCode(content, color, title, subtitle, showUrl);
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
