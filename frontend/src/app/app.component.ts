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
  errorMessage: string | null = null;
  loading: boolean = false;

  private currentRequestId = 0;
  private currentPngObjectUrl: string | null = null;
  private currentSvgObjectUrl: string | null = null;
  private currentPdfObjectUrl: string | null = null;
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

  async generateQrCode(
    content: string,
    color: string,
    title: string = this.pdfTitle,
    subtitle: string = this.pdfSubtitle,
    showUrl: boolean = this.showPdfUrl,
  ): Promise<void> {
    const requestId = ++this.currentRequestId;
    this.loading = true;
    const settings = { text: content, options: { color_scheme: color } };
    const pdfSettings = { ...settings, title: title, subtitle: subtitle, show_url: showUrl };

    try {
      const [pngResponse, svgResponse, pdfResponse] = await Promise.all([
        fetch(`${env.backend_url}/png`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }),
        fetch(`${env.backend_url}/svg`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }),
        fetch(`${env.backend_url}/pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdfSettings),
        }),
      ]);

      const failedResponse = [pngResponse, svgResponse, pdfResponse].find((response) => !response.ok);
      if (failedResponse) {
        let detail = '';
        try {
          const body = await failedResponse.json();
          detail = body?.error;
        } catch {
          // not json
        }
        if (detail) {
          throw new Error(detail);
        } else {
          throw new Error(`Der Server konnte den QR-Code nicht erstellen (Status ${failedResponse.status}).`);
        }
      }

      const [pngBuffer, svgBuffer, pdfBuffer] = await Promise.all([
        pngResponse.arrayBuffer(),
        svgResponse.arrayBuffer(),
        pdfResponse.arrayBuffer(),
      ]);

      if (this.currentRequestId !== requestId) {
        return;
      }

      const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
      const svgBlob = new Blob([svgBuffer], { type: 'image/svg+xml' });
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      this.revokeObjectUrls();

      this.currentPngObjectUrl = URL.createObjectURL(pngBlob);
      this.currentSvgObjectUrl = URL.createObjectURL(svgBlob);
      this.currentPdfObjectUrl = URL.createObjectURL(pdfBlob);

      this.png_src = this.getSantizeUrl(this.currentPngObjectUrl);
      this.svg_src = this.getSantizeUrl(this.currentSvgObjectUrl);
      this.pdf_src = this.getSantizeUrl(this.currentPdfObjectUrl);
      this.errorMessage = null;
    } catch (error) {
      if (this.currentRequestId !== requestId) {
        return;
      }

      if (
        error instanceof TypeError ||
        (error instanceof Error &&
          (error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('fetch')))
      ) {
        this.errorMessage = 'Das Backend ist nicht erreichbar. Bitte überprüfe die Verbindung zum Server.';
      } else if (error instanceof Error && error.message) {
        this.errorMessage = error.message;
      } else {
        this.errorMessage = 'Der QR-Code konnte nicht generiert werden.';
      }
    } finally {
      if (this.currentRequestId === requestId) {
        this.loading = false;
      }
    }
  }

  private revokeObjectUrls(): void {
    if (this.currentPngObjectUrl) {
      URL.revokeObjectURL(this.currentPngObjectUrl);
      this.currentPngObjectUrl = null;
    }
    if (this.currentSvgObjectUrl) {
      URL.revokeObjectURL(this.currentSvgObjectUrl);
      this.currentSvgObjectUrl = null;
    }
    if (this.currentPdfObjectUrl) {
      URL.revokeObjectURL(this.currentPdfObjectUrl);
      this.currentPdfObjectUrl = null;
    }
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
    this.revokeObjectUrls();
  }
}

