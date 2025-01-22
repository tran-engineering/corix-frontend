import { Injectable } from '@angular/core';
import { Todo, TodoControllerService } from '../../gen/todo-api';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  public saveTodo(todo: Todo) {
    return this.todoControllerService.createTodo(todo);
  }

  constructor(private todoControllerService: TodoControllerService) { }

  public getTodos() {
    return this.todoControllerService.getTodos();
  }

  public getTodo(id : string) {
    return this.todoControllerService.getTodo(id);
  }

  public updateTodo(todo: Todo) {
    return this.todoControllerService.updateTodo(todo);
  }
}
