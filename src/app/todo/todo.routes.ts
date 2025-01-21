import { Routes } from '@angular/router';
import { TodoOverviewComponent } from './todo-overview/todo-overview.component';
import { TodoEditComponent } from './todo-edit/todo-edit.component';

export const todoRoutes: Routes = [
    {
        path: '',
        component: TodoOverviewComponent
    },
    {
        path: 'edit/:id',
        component: TodoEditComponent
    },
    {
        path: 'new',
        component: TodoEditComponent
    }
];
