/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodInfoAgriDirectComponent } from './good-info-agri-direct.component';

describe('GoodInfoAgriDirectComponent', () => {
  let component: GoodInfoAgriDirectComponent;
  let fixture: ComponentFixture<GoodInfoAgriDirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoodInfoAgriDirectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoodInfoAgriDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
