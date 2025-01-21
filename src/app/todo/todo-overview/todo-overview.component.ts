import { Component } from '@angular/core';
import { TodoService } from '../todo.service';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-todo-overview',
  standalone: true,
  templateUrl: './todo-overview.component.html',
  styleUrl: './todo-overview.component.scss',
  imports: [AsyncPipe, RouterLink]
})
export class TodoOverviewComponent {

  todos$ = this.todoService.getTodos();

  constructor(private todoService: TodoService) { 
  }
}
