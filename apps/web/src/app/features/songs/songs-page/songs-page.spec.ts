import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongsPage } from './songs-page';

describe('SongsPage', () => {
  let component: SongsPage;
  let fixture: ComponentFixture<SongsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
