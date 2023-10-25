import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ApplicationFacade } from './application-state/application.facade';
import { combineLatestWith, tap } from 'rxjs';
import { environment as env } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  png_src: SafeUrl = 'assets/qr_code.png';
  svg_src: SafeUrl = 'assets/qr_code.svg';

  constructor(
    private sanitizer: DomSanitizer,
    readonly applicationFacade: ApplicationFacade,
  ) {}

  public getSantizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  generateQrCode(content: string, color: string): void {
    let settings = { text: content, options: { color_scheme: color } };

    fetch(`${env.backend_url}/png`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then((res) => {
        return res.arrayBuffer();
      })
      .then((png) => {
        const blob = new Blob([png], { type: 'image/png' });
        this.png_src = this.getSantizeUrl(URL.createObjectURL(blob));
      });

    fetch(`${env.backend_url}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then((res) => {
        return res.arrayBuffer();
      })
      .then((png) => {
        const blob = new Blob([png], { type: 'image/svg+xml' });
        this.svg_src = this.getSantizeUrl(URL.createObjectURL(blob));
      });
  }

  ngOnInit(): void {
    this.applicationFacade.content
      .pipe(
        combineLatestWith(this.applicationFacade.color),
        tap(([content, color]) => {
          this.generateQrCode(content, color);
        }),
      )
      .subscribe();
  }
}
