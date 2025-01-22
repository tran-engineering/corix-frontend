import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

  newTodo = true;

  livePolicy$ = new BehaviorSubject(false);

  policyResults: Record<string, Record<string, boolean>> = {};

  constructor(private router:Router, private activeRoute: ActivatedRoute, private todoService: TodoService, private policyService: PolicyService, private formBuilder: FormBuilder) {
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
    // EditableIf policy
    Object.entries(policyResults)
      .forEach(([field, { EditableIf }]) => EditableIf ? this.form.get(field)?.enable({ emitEvent: false }) : this.form.get(field)?.disable({ emitEvent: false }));
    this.policyResults = policyResults;
  }



  submit() {
    if (this.newTodo) {
      this.todoService.saveTodo({...this.form.getRawValue() as Todo}).subscribe(() => {
        this.router.navigate(['todo', 'edit', this.form.value.id]);
      });
    } else {
      this.todoService.updateTodo(this.form.getRawValue() as Todo).subscribe(() => {
        this.load();
      });
    }
    
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

  isVisible(fieldName: string) {
    if (this.policyResults[fieldName] == undefined) {
      return true;
    }
    if (!this.policyResults[fieldName].hasOwnProperty('VisibleIf')) {
      return true;
    }
    return this.policyResults[fieldName]['VisibleIf'];
  }
}
