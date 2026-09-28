import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ApplicationFacade } from './application-state/application.facade';
import { combineLatestWith, Subject, takeUntil, tap } from 'rxjs';
import { environment as env } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  png_src: SafeUrl = 'assets/qr_code.png';
  svg_src: SafeUrl = 'assets/qr_code.svg';
  errorMessage: string | null = null;
  loading: boolean = false;

  private currentRequestId = 0;
  private currentPngObjectUrl: string | null = null;
  private currentSvgObjectUrl: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private sanitizer: DomSanitizer,
    readonly applicationFacade: ApplicationFacade,
  ) {}

  public getSantizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async generateQrCode(content: string, color: string): Promise<void> {
    const requestId = ++this.currentRequestId;
    this.loading = true;
    const settings = { text: content, options: { color_scheme: color } };

    try {
      const [pngResponse, svgResponse] = await Promise.all([
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
      ]);

      if (!pngResponse.ok || !svgResponse.ok) {
        const failedResponse = !pngResponse.ok ? pngResponse : svgResponse;
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

      const [pngBuffer, svgBuffer] = await Promise.all([
        pngResponse.arrayBuffer(),
        svgResponse.arrayBuffer(),
      ]);

      if (this.currentRequestId !== requestId) {
        return;
      }

      const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
      const svgBlob = new Blob([svgBuffer], { type: 'image/svg+xml' });

      this.revokeObjectUrls();

      this.currentPngObjectUrl = URL.createObjectURL(pngBlob);
      this.currentSvgObjectUrl = URL.createObjectURL(svgBlob);

      this.png_src = this.getSantizeUrl(this.currentPngObjectUrl);
      this.svg_src = this.getSantizeUrl(this.currentSvgObjectUrl);
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
  }

  ngOnInit(): void {
    this.applicationFacade.content
      .pipe(
        takeUntil(this.destroy$),
        combineLatestWith(this.applicationFacade.color),
        tap(([content, color]) => {
          this.generateQrCode(content, color);
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

