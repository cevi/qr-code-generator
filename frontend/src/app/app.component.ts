import {Component} from '@angular/core';
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  qr_link: string = "https://cevi.ch";
  png_src: SafeUrl = "assets/qr_code.png";
  svg_src: SafeUrl = "assets/qr_code.svg";
  color: string = 'cevi';

  constructor(private sanitizer: DomSanitizer) {
  }

  public getSantizeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onLinkChange() {

    console.log('Link: ' + this.qr_link);

    let settings = {"link": this.qr_link, "options": {"color_scheme": this.color}};

    fetch("http://localhost:5000/png", {

      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(settings)

    }).then(res => {

      console.log("Request complete! response:", res);
      return res.arrayBuffer();

    }).then(png => {

      const blob = new Blob([png], {'type': 'image/png'});
      console.log("Blob:", blob);
      this.png_src = this.getSantizeUrl(URL.createObjectURL(blob));

    });


    fetch("http://localhost:5000/svg", {

      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(settings)

    }).then(res => {

      console.log("Request complete! response:", res);
      return res.arrayBuffer();

    }).then(png => {

      const blob = new Blob([png], {'type': 'image/svg+xml'});
      console.log("Blob:", blob);
      this.svg_src = this.getSantizeUrl(URL.createObjectURL(blob));

    });


  }


}
