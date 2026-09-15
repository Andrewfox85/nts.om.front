/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectPreviewComponent } from './direct-preview.component';

describe('DirectPreviewComponent', () => {
  let component: DirectPreviewComponent;
  let fixture: ComponentFixture<DirectPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirectPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
