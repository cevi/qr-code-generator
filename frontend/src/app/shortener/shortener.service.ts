import { Injectable } from '@angular/core';
import { environment as env } from '../../environments/environment';

/**
 * Talks to the backend's /shorten endpoint, which wraps the Cevi.Tools URL
 * shortener. The shortener's API key lives on the backend, so it is never
 * shipped to the browser.
 */
@Injectable({
  providedIn: 'root',
})
export class ShortenerService {
  async shorten(url: string): Promise<string> {
    const response = await fetch(`${env.backend_url}/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: url }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(body?.error ?? `Der Kürzungsdienst meldete den Status ${response.status}.`);
    }

    if (!body?.link) {
      throw new Error('Der Kürzungsdienst hat keinen Link zurückgegeben.');
    }

    return body.link;
  }
}
