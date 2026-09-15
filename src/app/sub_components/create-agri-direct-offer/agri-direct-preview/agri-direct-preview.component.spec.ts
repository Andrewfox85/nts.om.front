/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgriDirectPreviewComponent } from './agri-direct-preview.component';

describe('AgriDirectPreviewComponent', () => {
  let component: AgriDirectPreviewComponent;
  let fixture: ComponentFixture<AgriDirectPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgriDirectPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgriDirectPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
