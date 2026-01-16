import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetlistsPage } from './setlists-page';

describe('SetlistsPage', () => {
  let component: SetlistsPage;
  let fixture: ComponentFixture<SetlistsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetlistsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetlistsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
