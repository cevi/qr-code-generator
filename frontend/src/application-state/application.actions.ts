import { QrCodeTypes } from '../types/qr-code-types';

export class SetColor {
  static readonly type = '[ApplicationState] Set Color';
  constructor(public color: string) {}
}

export class SetType {
  static readonly type = '[ApplicationState] Set Type';
  constructor(public type: QrCodeTypes) {}
}

export class SetContent {
  static readonly type = '[ApplicationState] Set Content';
  constructor(public content: string) {}
}
