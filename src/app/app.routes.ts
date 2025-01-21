import { Routes } from '@angular/router';
import { todoRoutes } from './todo/todo.routes';


export const routes: Routes = [
    {
        path: 'todo',
        children: todoRoutes
    },
    {
        path: '',
        component: todoRoutes[0].component
    }
];
