/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasisDirectInfoComponent } from './basis-direct-info.component';

describe('BasisDirectInfoComponent', () => {
  let component: BasisDirectInfoComponent;
  let fixture: ComponentFixture<BasisDirectInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasisDirectInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasisDirectInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
