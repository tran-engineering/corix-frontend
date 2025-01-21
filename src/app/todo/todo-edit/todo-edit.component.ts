import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, of, switchMap } from 'rxjs';
import { Todo } from '../../../gen/todo-api';
import { PolicyService } from '../../policy/policy.service';
import { TodoService } from '../todo.service';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-todo-edit',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, AsyncPipe],
  templateUrl: './todo-edit.component.html',
  styleUrl: './todo-edit.component.scss'
})
export class TodoEditComponent {

  static POLICY = "Todo";

  form = this.formBuilder.group({
    id: [crypto.randomUUID()],
    title: [''],
    description: [''],
    state: [Todo.StateEnum.New]
  });

  livePolicy$ = new BehaviorSubject(false);

  constructor(private activeRoute: ActivatedRoute, private todoService: TodoService, private policyService: PolicyService, private formBuilder: FormBuilder) {
    if (this.activeRoute.snapshot.params['id']) {
      this.load();
    }

    combineLatest([this.form.valueChanges, this.livePolicy$])
      .pipe(
        filter(([, livePolicy]) => livePolicy),
        switchMap(([todo]) => policyService.editableFields(TodoEditComponent.POLICY, of(todo)).pipe(map(editableFields => ({ todo, editableFields })))),
        map(({ editableFields }) => (editableFields))
      ).subscribe(editableFields => {
        this.updateEditableFields(editableFields);
      });
  }

  updateEditableFields(editableFields: Record<string, boolean>) {
    Object.entries(editableFields)
      .forEach(([field, editable]) => editable ? this.form.get(field)?.enable({ emitEvent: false }) : this.form.get(field)?.disable({ emitEvent: false }));
  }

  submit() {
    console.log('submit!!');
    this.todoService.saveTodo(this.form.getRawValue() as Todo).subscribe(() => {
      this.load();
      console.log('SUCCESS');
    });
  }

  load() {
    // When editing an existing entity, get it from the server and apply policies.
    this.todoService.getTodo(this.activeRoute.snapshot.params['id'])
      .pipe(
        switchMap(todo => this.policyService.editableFields(TodoEditComponent.POLICY, of(todo)).pipe(map(editableFields => ({ todo, editableFields })))
        ),
      )
      .subscribe(({ todo, editableFields }) => {
        this.form.patchValue(todo);
        this.updateEditableFields(editableFields);
      });
  }
}
