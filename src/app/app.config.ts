import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { ApiModule as TodoApiModule, Configuration as TodoApiConfiguration } from '../gen/todo-api';
import { ApiModule as PolicyApiModule, Configuration as PolicyApiConfiguration } from '../gen/policy-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(
      TodoApiModule.forRoot(() => new TodoApiConfiguration({ basePath: '' })),
      PolicyApiModule.forRoot(() => new PolicyApiConfiguration({ basePath: '' })),
    )
  ]
};
