# QR Code Generator mit Cevi Logo

Dies ist ein einfaches python script, dass QR Codes generiert und in einer SVG Datei speichert.

![Beispiel QR Code](./docu/example_qr_code.png)

## ToDo's

- [ ] Build simple webpage as frontend
- [ ] add filter for valid webpages, if needed??
- [ ] host on [qr.cevi.tools](qr.cevi.tools)

## How to use?

Start the backend docker container using

```bash 
docker-compose up
```

Then you can fetch a QR code using the following command:

```bash
curl --header "Content-Type: application/json"   --request POST   --data '{"link":"https://cevi.ch"}'   http://localhost:5000 > logo.svg
```

