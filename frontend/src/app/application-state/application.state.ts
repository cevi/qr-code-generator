import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { SetColor, SetContent, SetType } from './application.actions';
import { ApplicationModel } from './application-model';
import { QrCodeTypes } from '../../types/qr-code-types';

const defaults: ApplicationModel = {
  color: 'cevi',
  type: QrCodeTypes.Link,
  content: 'https://cevi.ch',
};

@State<ApplicationModel>({
  name: 'application',
  defaults,
})
@Injectable()
export class ApplicationState {
  constructor() {}

  @Selector() static color(state: ApplicationModel) {
    return state.color;
  }

  @Selector() static type(state: ApplicationModel) {
    return state.type;
  }

  @Selector() static content(state: ApplicationModel) {
    return state.content;
  }

  @Action(SetColor)
  setColor(context: StateContext<ApplicationModel>, action: SetColor) {
    context.patchState({
      color: action.color,
    });
  }

  @Action(SetType)
  setType(context: StateContext<ApplicationModel>, action: SetType) {
    context.patchState({
      type: action.type,
    });
  }

  @Action(SetContent)
  setContent(context: StateContext<ApplicationModel>, action: SetContent) {
    context.patchState({
      content: action.content,
    });
  }
}
