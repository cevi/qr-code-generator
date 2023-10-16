import { NgModule } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [HeaderComponent, FooterComponent],
  imports: [CommonModule],
  providers: [],
  exports: [HeaderComponent, FooterComponent],
})
export class DesignModule {}
