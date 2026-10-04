import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorProducto } from './editor-producto';

describe('EditorProducto', () => {
  let component: EditorProducto;
  let fixture: ComponentFixture<EditorProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorProducto],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorProducto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
