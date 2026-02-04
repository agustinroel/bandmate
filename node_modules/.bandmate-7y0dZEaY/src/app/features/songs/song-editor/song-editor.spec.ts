import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SongEditor } from './song-editor';

describe('SongEditor', () => {
  let component: SongEditor;
  let fixture: ComponentFixture<SongEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SongEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
