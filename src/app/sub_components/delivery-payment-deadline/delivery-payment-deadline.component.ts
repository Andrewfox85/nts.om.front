/* eslint-disable */
import {
  Component,
  Input,
  OnInit
} from '@angular/core';

@Component({
  selector: 'ceit-delivery-payment-deadline',
  templateUrl: './delivery-payment-deadline.component.html',
  styleUrls: ['./delivery-payment-deadline.component.scss']
})
export class DeliveryPaymentDeadlineComponent implements OnInit {
  @Input() paymentTermConcated: string;
  @Input() deliveryTermConcated: string;
  @Input() deadlineErrorMess: string;
  @Input() deadlineDelivery: number | string;
  @Input() deadlinePayment: number | string;

  constructor() {
  }

  ngOnInit(): void {
  }
}
