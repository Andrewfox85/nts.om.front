/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodInfoDirectComponent } from './good-info-direct.component';

describe('GoodInfoDirectComponent', () => {
  let component: GoodInfoDirectComponent;
  let fixture: ComponentFixture<GoodInfoDirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoodInfoDirectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoodInfoDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
