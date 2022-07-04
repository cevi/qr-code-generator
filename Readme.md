# QR Code Generator mit Cevi Logo

Dies ist eine einfache API mit Webinterface, das es erlaubt, QR-Codes mit dem Cevi-Logo zu erstellen.
QR Codes können als PNG oder SVG erstellt werden und sind in den Farben des Cevi-Logo eingefärbt.

## Beispiel eines Cevi-QR-Codes

Die API erstellt QR-Code, die wie folgt aussehen:

![Beispiel QR Code](./docu/example_qr_code.png)

## Open ToDo's

- [ ] host on [qr.cevi.tools](qr.cevi.tools)

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

Both endpoints queried using a POST request. With a JSON body containing the qr code parameters:

```yaml
{

  // always required
  "link": "https://link/to/your/url",

  // optional parameters for the QR code
  "options": {
    "color-scheme": "cevi"  // default is "cevi", other options are "black" and "white"
  }

}
```
