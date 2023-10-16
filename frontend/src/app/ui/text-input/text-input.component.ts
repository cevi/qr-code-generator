import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule],
})
export class TextInputComponent {
  @Input()
  type = 'text';
  @Input()
  control: any;

  @Input()
  label: string;

  @Input()
  defaultValue = '';

  @Input()
  placeholder = '';

  value = '';
}
