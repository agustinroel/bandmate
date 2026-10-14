import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongFormComponent } from './song-form';

describe('SongFormComponent', () => {
  let component: SongFormComponent;
  let fixture: ComponentFixture<SongFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
