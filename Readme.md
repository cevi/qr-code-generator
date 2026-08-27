# QR Code Generator mit Cevi Logo

Dies ist eine einfache API mit Webinterface, das es erlaubt, QR-Codes mit dem Cevi-Logo zu erstellen.
QR Codes können als PNG oder SVG erstellt werden und sind in den Farben des Cevi-Logo eingefärbt.

## Beispiel eines Cevi-QR-Codes

Die API erstellt QR-Code, die wie folgt aussehen:

![Beispiel QR Code](./docu/example_qr_code.png)

## How to use?

You can start the backend container with the following command:

```bash 
docker-compose up --build
```

Now you can interact with the webinterface on [localhost:80](http://localhost:80). Or you can directly query the API
with the following command:

```bash
curl --header "Content-Type: application/json"   --request POST   --data '{"link":"https://cevi.ch"}'   http://localhost:5000/svg > qr_code.svg
```

### Available Endpoints

Currently, the following endpoints are available:

- `/svg`: Generates a QR Code and returns it as a string forming an SVG
- `/png`: Generates a QR Code and returns it as a byte stream
- `/shorten`: Shortens a URL with the Cevi.Tools URL shortener (see below)

All endpoints are queried using a POST request. `/svg` and `/png` take a JSON body containing the qr code parameters:

```yaml
{

  // always required
  "text": "https://link/to/your/url",

  // optional parameters for the QR code
  "options": {
    "color-scheme": "cevi"  // default is "cevi", other options are "black" and "white"
  }

}
```

## Optional URL Shortening

The link form offers a **Link kürzen** button that swaps the entered URL for a
short `go.cevi.tools` link before the QR code is generated. Shorter content
means a less dense QR code, which is easier to scan in print.

The frontend does not talk to the shortener directly. It posts to the backend,
which forwards the request to the [Cevi.Tools URL
shortener](https://github.com/cevi/cevi-url-shortener) with an API key that
stays on the server:

```bash
curl --header "Content-Type: application/json" \
  --request POST --data '{"text":"https://cevi.ch/a/very/long/path"}' \
  http://localhost:5080/shorten
# {"link": "https://go.cevi.tools/AbC123"}
```

The backend reads the following environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `SHORTENER_API_KEY` | *(empty)* | Kutt API key. **Required** — without it `/shorten` answers `503`. |
| `SHORTENER_API_URL` | `https://backend-go.cevi.tools/api/v2/links` | Kutt endpoint to post to. |
| `SHORTENER_DOMAIN` | `go.cevi.tools` | Domain the short links are created on. |
| `SHORTENER_TIMEOUT` | `10` | Request timeout in seconds. |

Set the key before starting the stack:

```bash
SHORTENER_API_KEY=<your kutt api key> docker-compose up --build
```

If no key is configured the rest of the generator keeps working; only the
shortening button reports that the service is unavailable.
