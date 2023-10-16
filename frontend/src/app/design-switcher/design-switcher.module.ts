import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DesignSwitcherComponent } from './components/design-switcher/design-switcher.component';

@NgModule({
  declarations: [DesignSwitcherComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [],
  exports: [DesignSwitcherComponent],
})
export class DesignSwitcherModule {}
