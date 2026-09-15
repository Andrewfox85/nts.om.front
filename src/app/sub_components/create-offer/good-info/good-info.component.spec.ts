/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodInfoComponent } from './good-info.component';

describe('GoodInfoComponent', () => {
  let component: GoodInfoComponent;
  let fixture: ComponentFixture<GoodInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoodInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoodInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
