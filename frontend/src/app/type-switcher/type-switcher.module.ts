import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypeSwitcherComponent } from './components/type-switcher/type-switcher.component';
import { LinkComponent } from './components/link/link.component';
import { PhoneComponent } from './components/phone/phone.component';
import { ContactComponent } from './components/contact/contact.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TextInputComponent } from '../ui/text-input/text-input.component';
import { WifiComponent } from './components/wifi/wifi.component';
import { ButtonComponent } from '../ui/button/button.component';

@NgModule({
  declarations: [TypeSwitcherComponent, LinkComponent, PhoneComponent, ContactComponent, WifiComponent],
  imports: [CommonModule, ButtonComponent, ReactiveFormsModule, TextInputComponent],
  providers: [],
  exports: [TypeSwitcherComponent],
})
export class TypeSwitcherModule {}
