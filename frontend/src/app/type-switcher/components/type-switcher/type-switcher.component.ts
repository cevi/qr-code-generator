import { Component } from '@angular/core';
import { QrCodeTypes } from 'src/types/qr-code-types';
import { ApplicationFacade } from '../../../application-state/application.facade';

@Component({
  selector: 'type-switcher',
  templateUrl: './type-switcher.component.html',
  styleUrls: ['./type-switcher.component.scss'],
})
export class TypeSwitcherComponent {
  types = QrCodeTypes;
  constructor(readonly applicationFacade: ApplicationFacade) {}
  onTypeSwitched(event: any) {
    this.applicationFacade.setType(event.target.value);
  }
}
