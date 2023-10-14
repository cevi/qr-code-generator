import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxsModule } from '@ngxs/store';
import { ApplicationState } from './application.state';
import { CoreModule } from '../core/core.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, NgxsModule.forFeature([ApplicationState]), CoreModule],
  providers: [],
})
export class ApplicationModule {}
