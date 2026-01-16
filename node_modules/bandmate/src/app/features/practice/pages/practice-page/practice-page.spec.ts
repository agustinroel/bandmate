import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PracticePage } from './practice-page';

describe('PracticePage', () => {
  let component: PracticePage;
  let fixture: ComponentFixture<PracticePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PracticePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
