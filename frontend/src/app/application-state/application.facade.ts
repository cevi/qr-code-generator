import { Injectable } from '@angular/core';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ApplicationState } from './application.state';
import { SetColor, SetContent, SetType } from './application.actions';
import { QrCodeTypes } from '../../types/qr-code-types';

@Injectable({
  providedIn: 'root',
})
export class ApplicationFacade {
  @Select(ApplicationState.color)
  color: Observable<string>;
  @Select(ApplicationState.type)
  type: Observable<QrCodeTypes>;
  @Select(ApplicationState.content)
  content: Observable<string>;

  @Dispatch()
  setColor = (color: string) => new SetColor(color);
  @Dispatch()
  setType = (type: QrCodeTypes) => new SetType(type);
  @Dispatch()
  setContent = (content: string) => new SetContent(content);
}
