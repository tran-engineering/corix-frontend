import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, of, switchMap } from 'rxjs';
import { Todo } from '../../../gen/todo-api';
import { PolicyService } from '../../policy/policy.service';
import { TodoService } from '../todo.service';

@Component({
  selector: 'app-todo-edit',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './todo-edit.component.html',
  styleUrl: './todo-edit.component.scss'
})
export class TodoEditComponent {

  static POLICY = "Todo";

  form = this.formBuilder.group({
    id: [crypto.randomUUID()],
    title: [''],
    description: [''],
    postMortemNotes: [''],
    state: [Todo.StateEnum.New]
  });

  newTodo = false;

  livePolicy$ = new BehaviorSubject(false);

  constructor(private activeRoute: ActivatedRoute, private todoService: TodoService, private policyService: PolicyService, private formBuilder: FormBuilder) {
    if (this.activeRoute.snapshot.params['id']) {
      this.load();
    }

    combineLatest([this.form.valueChanges, this.livePolicy$])
      .pipe(
        filter(([, livePolicy]) => livePolicy),
        switchMap(([entity]) => this.policyService.evaluatePolicies(TodoEditComponent.POLICY, of(entity))),
      ).subscribe(({ policyResults }) => {
        this.applyPolicyToForm(policyResults);
      });
  }

  applyPolicyToForm(policyResults: Record<string, Record<string, boolean>>) {
    Object.entries(policyResults)
      .forEach(([field, { EditableIf }]) => EditableIf ? this.form.get(field)?.enable({ emitEvent: false }) : this.form.get(field)?.disable({ emitEvent: false }));
  }

  submit() {
    if (this.newTodo) {
      this.todoService.saveTodo({...this.form.getRawValue() as Todo}).subscribe(() => {
        this.load();
      });
    }
    this.todoService.updateTodo(this.form.getRawValue() as Todo).subscribe(() => {
      this.load();
    });
  }

  load() {
    this.newTodo = false;
    // When editing an existing entity, get it from the server and apply policies.
    this.todoService.getTodo(this.activeRoute.snapshot.params['id']).pipe(
      switchMap(todo => this.policyService.evaluatePolicies(TodoEditComponent.POLICY, of(todo)))
    ).subscribe(({ entity, policyResults }) => {
      this.form.patchValue(entity);
      this.applyPolicyToForm(policyResults);
    });
  }
}
