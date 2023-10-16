import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { environment } from '../environments/environment';
import { NgxsDispatchPluginModule } from '@ngxs-labs/dispatch-decorator';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { ApplicationModule } from './application-state/application.module';
import { TypeSwitcherModule } from './type-switcher/type-switcher.module';
import { DesignSwitcherModule } from './design-switcher/design-switcher.module';
import { ButtonComponent } from './ui/button/button.component';
import { DesignModule } from './design/design.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    ApplicationModule,
    TypeSwitcherModule,
    DesignSwitcherModule,
    BrowserModule,
    AppRoutingModule,
    ButtonComponent,
    DesignModule,
    NgxsModule.forRoot([], {
      developmentMode: !environment.production,
    }),
    NgxsDispatchPluginModule.forRoot(),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot({
      collapsed: false,
      disabled: environment.production,
    }),
    NgxsRouterPluginModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
